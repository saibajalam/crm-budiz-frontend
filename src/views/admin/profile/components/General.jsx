import Card from "components/card";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "api/services/profile.service";

const General = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.get,
  });

  const fields = [
    { label: "Education", key: "education" },
    { label: "Languages", key: "languages" },
    { label: "Department", key: "department" },
    { label: "Work History", key: "work_history" },
    { label: "Organization", key: "organization" },
    { label: "Birthday", key: "birthday" },
  ];

  return (
    <Card extra={"w-full h-full p-3"}>
      {/* Header */}
      <div className="mt-2 mb-8 w-full">
        <h4 className="px-2 text-xl font-bold text-navy-700 dark:text-white">
          General Information
        </h4>
        <p className="mt-2 px-2 text-base text-gray-600">
          {isLoading ? "Loading..." : profile?.bio || "No bio available."}
        </p>
      </div>
      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 px-2">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none"
          >
            <p className="text-sm text-gray-600">{field.label}</p>
            <p className="text-base font-medium text-navy-700 dark:text-white">
              {isLoading ? "..." : profile?.[field.key] || "—"}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default General;
