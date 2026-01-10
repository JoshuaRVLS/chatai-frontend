import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine
from dotenv import load_dotenv
from matplotlib.gridspec import GridSpec
from datetime import datetime

# Load environment variables
load_dotenv()

# Database Connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env file")

# SQLAlchemy requires 'postgresql://' instead of 'postgres://' for some versions
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Remove 'pgbouncer=true' and other query params which might confuse psycopg2
if "?" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?")[0]

engine = create_engine(DATABASE_URL)

def fetch_data():
    """Fetch analytics data from PostgreSQL."""
    
    # 1. Total Stats
    total_stats = pd.read_sql("""
        SELECT 
            (SELECT COUNT(*) FROM "User") as users,
            (SELECT COUNT(*) FROM "Character") as characters,
            (SELECT COUNT(*) FROM "Chat") as chats,
            (SELECT COUNT(*) FROM "Message") as messages
    """, engine).iloc[0]

    # 2. Daily Chat Activity (Last 30 Days)
    chat_activity = pd.read_sql("""
        SELECT DATE("createdAt") as date, COUNT(*) as count 
        FROM "Chat" 
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt") 
        ORDER BY date ASC
    """, engine)

    # 3. Top 5 Popular Characters
    top_characters = pd.read_sql("""
        SELECT c.name, COUNT(ch.id) as chat_count
        FROM "Character" c
        JOIN "Chat" ch ON c.id = ch."characterId"
        GROUP BY c.id, c.name
        ORDER BY chat_count DESC
        LIMIT 5
    """, engine)
    
    # 4. NSFW vs SFW Characters
    nsfw_ratio = pd.read_sql("""
        SELECT "isNsfw", COUNT(*) as count 
        FROM "Character" 
        GROUP BY "isNsfw"
    """, engine)
    nsfw_ratio['Type'] = nsfw_ratio['isNsfw'].map({True: 'NSFW', False: 'SFW'})

    return total_stats, chat_activity, top_characters, nsfw_ratio

def generate_report(total, daily_chats, top_chars, nsfw_data):
    """Generate a consolidated analytics image."""
    
    # Set up the figure dashboard layout
    sns.set_theme(style="darkgrid", context="talk")
    # Custom darker theme colors
    plt.rcParams['axes.facecolor'] = '#18181b' # zinc-900
    plt.rcParams['figure.facecolor'] = '#09090b' # zinc-950
    plt.rcParams['text.color'] = '#f4f4f5'
    plt.rcParams['axes.labelcolor'] = '#a1a1aa'
    plt.rcParams['xtick.color'] = '#71717a'
    plt.rcParams['ytick.color'] = '#71717a'
    
    fig = plt.figure(figsize=(20, 12))
    gs = GridSpec(2, 2, figure=fig, height_ratios=[1, 1], wspace=0.3, hspace=0.4)
    
    # --- 1. Daily Chat Activity (Line Plot) ---
    ax1 = fig.add_subplot(gs[0, :]) # Span entire top row
    if not daily_chats.empty:
        daily_chats['date'] = pd.to_datetime(daily_chats['date'])
        sns.lineplot(data=daily_chats, x='date', y='count', ax=ax1, color='#10b981', linewidth=3, marker='o')
        ax1.fill_between(daily_chats['date'], daily_chats['count'], color='#10b981', alpha=0.1)
        ax1.set_title('Daily Conversations (Last 30 Days)', fontsize=20, pad=20, color='white', fontweight='bold')
        ax1.set_xlabel('')
        ax1.set_ylabel('Chats Started')
    else:
        ax1.text(0.5, 0.5, "No recent chat activity", ha='center', va='center', color='gray')
        ax1.set_title('Daily Conversations', fontsize=20, color='white')

    # --- 2. Top Characters (Bar Plot) ---
    ax2 = fig.add_subplot(gs[1, 0])
    if not top_chars.empty:
        sns.barplot(data=top_chars, x='chat_count', y='name', ax=ax2, palette="viridis", hue='name', legend=False)
        ax2.set_title('Top 5 Popular Characters', fontsize=18, pad=15, color='white', fontweight='bold')
        ax2.set_xlabel('Total Chats')
        ax2.set_ylabel('')
    else:
        ax2.text(0.5, 0.5, "No character data", ha='center', va='center', color='#52525b')
        ax2.set_title('Top Characters', fontsize=18, color='white')

    # --- 3. Content Distribution (Donut Chart) ---
    ax3 = fig.add_subplot(gs[1, 1])
    if not nsfw_data.empty:
        colors = ['#f87171', '#10b981'] if nsfw_data.iloc[0]['Type'] == 'NSFW' else ['#10b981', '#f87171']
        # Ensure consistent coloring if possible, simpler to just rely on map or a specific dict
        color_map = {'NSFW': '#f87171', 'SFW': '#34d399'}
        chart_colors = [color_map.get(t, 'gray') for t in nsfw_data['Type']]
        
        wedges, texts, autotexts = ax3.pie(
            nsfw_data['count'], 
            labels=nsfw_data['Type'], 
            autopct='%1.1f%%', 
            startangle=90, 
            pctdistance=0.85,
            colors=chart_colors,
            textprops={'color':"white", 'weight':'bold'}
        )
        # Draw circle for Donut chart
        centre_circle = plt.Circle((0,0),0.70,fc='#09090b')
        fig.gca().add_artist(centre_circle)
        ax3.set_title('Content Distribution (NSFW vs SFW)', fontsize=18, pad=15, color='white', fontweight='bold')
    else:
        ax3.text(0.5, 0.5, "No content data", ha='center', va='center', color='gray')

    # --- Summary Text Overlay (Bottom Right Corner or Header) ---
    plt.figtext(0.02, 0.96, f"JChatAI Health Report", fontsize=32, fontweight='bold', color='white')
    plt.figtext(0.02, 0.92, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", fontsize=14, color='#a1a1aa')
    
    # KPIs
    kpi_y = 0.94
    plt.figtext(0.8, kpi_y, f"{total['users']:,}", fontsize=24, fontweight='bold', color='white', ha='center')
    plt.figtext(0.8, kpi_y-0.03, "Total Users", fontsize=10, color='#a1a1aa', ha='center')
    
    plt.figtext(0.9, kpi_y, f"{total['messages']:,}", fontsize=24, fontweight='bold', color='#38bdf8', ha='center')
    plt.figtext(0.9, kpi_y-0.03, "Messages Sent", fontsize=10, color='#a1a1aa', ha='center')

    # Save
    output_dir = "public/reports"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "analytics_dashboard.png")
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    print(f"Report generated successfully: {output_path}")

if __name__ == "__main__":
    try:
        t, d, c, n = fetch_data()
        generate_report(t, d, c, n)
    except Exception as e:
        print(f"Error generating report: {e}")
