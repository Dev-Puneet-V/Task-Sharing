import React from "react";
import Skeleton from "../common/Skeleton";

const TaskCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="w-3/4">
          <Skeleton height="1.5rem" className="mb-2" variant="text" />
          <Skeleton height="3rem" className="mb-4" count={2} variant="text" />
        </div>
        <div className="flex space-x-2">
          <Skeleton width="2rem" height="2rem" variant="circular" />
          <Skeleton width="2rem" height="2rem" variant="circular" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton
          width="4rem"
          height="1.5rem"
          count={3}
          className="inline-block"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Skeleton width="8rem" height="2rem" />
        <Skeleton width="8rem" height="2rem" />
        <Skeleton width="8rem" height="2rem" />
      </div>

      <div className="mt-4 pt-4 border-t">
        <Skeleton width="6rem" height="1rem" className="mb-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton
            width="5rem"
            height="1.5rem"
            count={2}
            className="inline-block"
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCardSkeleton;
