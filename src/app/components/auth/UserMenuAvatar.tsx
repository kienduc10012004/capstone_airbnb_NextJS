"use client";

import Image from "next/image";
import { useState } from "react";

import { getImageSource } from "@/app/lib/image";

type UserMenuAvatarProps = {
  avatar?: string;
  name: string;
};

const UserMenuAvatar = ({ avatar, name }: UserMenuAvatarProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarSource = getImageSource(avatar);

  return (
    <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gray-900 text-sm font-semibold text-white">
      {avatarSource && !imageFailed ? (
        <Image
          fill
          alt={`Ảnh đại diện của ${name}`}
          className="object-cover"
          sizes="32px"
          src={avatarSource}
          onError={() => setImageFailed(true)}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
};

export default UserMenuAvatar;
