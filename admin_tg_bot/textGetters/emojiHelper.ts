export function setEmoji(text: string, emoji: string, toSet: boolean = false) {
    if (toSet) {
        return emoji + text;
    } else {
        return text;
    }
}