import React from "react";
import banner from "assets/img/profile/banner.png";
import Card from "components/card";
import { useProfile } from "domains/profile/hooks";

const Banner = () => {
  const { data: profile, isLoading } = useProfile();

  return (
    <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
      {/* Background and profile */}
      <div
        className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
        style={{ backgroundImage: `url(${banner})` }}
      >
        <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-pink-400 dark:!border-navy-700">
          {profile?.avatar ? (
            <img className="h-full w-full rounded-full" src={profile.avatar} alt="" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
              {profile?.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
      </div>

      {/* Name and position */}
      <div className="mt-16 flex flex-col items-center">
        <h4 className="text-xl font-bold text-navy-700 dark:text-white">
          {isLoading ? "..." : profile?.name || "—"}
        </h4>
        <p className="text-base font-normal text-gray-600">
          {profile?.position || profile?.role || "—"}
        </p>
      </div>

      {/* Post followers */}
      <div className="mt-6 mb-3 flex gap-4 md:!gap-14">
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {profile?.posts_count ?? "—"}
          </p>
          <p className="text-sm font-normal text-gray-600">Posts</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {profile?.followers_count ?? "—"}
          </p>
          <p className="text-sm font-normal text-gray-600">Followers</p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-navy-700 dark:text-white">
            {profile?.following_count ?? "—"}
          </p>
          <p className="text-sm font-normal text-gray-600">Following</p>
        </div>
      </div>
    </Card>
  );
};

export default Banner;
