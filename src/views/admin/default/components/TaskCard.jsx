import CardMenu from "components/card/CardMenu";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import Checkbox from "components/checkbox";
import { MdDragIndicator, MdCheckCircle } from "react-icons/md";
import Card from "components/card";
import { dashboardService } from "api/services/dashboard.service";

const TaskCard = () => {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: dashboardService.getTasks,
  });

  const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.data || [];

  return (
    <Card extra="pb-7 p-[20px]">
      {/* task header */}
      <div className="relative flex flex-row justify-between">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-100 dark:bg-white/5">
            <MdCheckCircle className="h-6 w-6 text-brand-500 dark:text-white" />
          </div>
          <h4 className="ml-4 text-xl font-bold text-navy-700 dark:text-white">
            Tasks
          </h4>
        </div>
        <CardMenu />
      </div>

      {/* task content */}
      <div className="h-full w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No tasks found</p>
        ) : (
          tasks.map((task, index) => (
            <div key={task.id || index} className={`${index === 0 ? "mt-5" : "mt-2"} flex items-center justify-between p-2`}>
              <div className="flex items-center justify-center gap-2">
                <Checkbox defaultChecked={task.completed || false} />
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  {task.title || task.name}
                </p>
              </div>
              <div>
                <MdDragIndicator className="h-6 w-6 text-navy-700 dark:text-white" />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
