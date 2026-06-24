// Ownership is encoded in each pack's document permissions (the creator gets
// update/delete on their own pack), so we don't need a separate `userId`
// attribute. A pack is "yours" if you can edit it.
export function ownsPack(pack: { $permissions?: string[] }, userId: string): boolean {
	if (!userId) return false;
	const perms = pack.$permissions ?? [];
	return perms.includes(`update("user:${userId}")`) || perms.includes(`delete("user:${userId}")`);
}
