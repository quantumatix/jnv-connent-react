import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

/**
 * Ensures timestamp is parsed as UTC by appending Z if missing
 */
function ensureUTC(isoString: string): string {
    if (!isoString) return '';
    return isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
}

/**
 * Format message time to "2:30 PM"
 */
export function formatMessageTime(isoString: string): string {
    try {
        const date = new Date(ensureUTC(isoString));
        return format(date, 'h:mm a');
    } catch (err) {
        return '';
    }
}

/**
 * Format relative date to "Today", "Yesterday", or "Mar 3"
 */
export function formatRelativeDate(isoString: string): string {
    try {
        const date = new Date(ensureUTC(isoString));
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    } catch (err) {
        return '';
    }
}

/**
 * Format relative time distance e.g. "5 minutes ago"
 */
export function formatTimeDistance(isoString: string): string {
    try {
        const date = new Date(ensureUTC(isoString));
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
        return '';
    }
}
