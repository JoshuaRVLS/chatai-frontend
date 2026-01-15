export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800 dark:border-zinc-800 dark:border-t-zinc-100" />
        </div>
    );
}
