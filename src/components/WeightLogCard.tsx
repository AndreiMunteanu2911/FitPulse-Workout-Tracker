import React from "react";

interface WeightLogCardProps {
  date: string; // ISO string
  weight: number;
}

const WeightLogCard: React.FC<WeightLogCardProps> = ({ date, weight }) => {
  // Format date as DD/MM/YYYY
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-white w-full">
      <span className="text-gray-700 font-semibold">{formattedDate}</span>
      <span className="text-[var(--primary-700)] font-semibold">{weight} kg</span>
    </div>
  );
};

export default WeightLogCard;

