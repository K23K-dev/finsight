import { User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@finsight/ui/avatar";

export function UserAvatar({
  image,
  name,
}: {
  image?: string | null;
  name?: string | null;
}) {
  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage
        src={image ?? undefined}
        alt={name ?? "User"}
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="rounded-lg">
        <User className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
