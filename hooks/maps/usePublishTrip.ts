import { useState } from "react";

export const usePublishTrip = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55];
  const [depHour, setDepHour] = useState<number>(new Date().getHours());
  const [depMin, setDepMin] = useState<number>(0);
  const [arrHour, setArrHour] = useState<number>(
    (new Date().getHours() + 1) % 24
  );
  const [arrMin, setArrMin] = useState<number>(0);
  const [seats, setSeats] = useState<number>(3);

  return {
    hours,
    mins,
    depHour,
    depMin,
    arrHour,
    arrMin,
    seats,
    setDepHour,
    setDepMin,
    setArrHour,
    setArrMin,
    setSeats,
  };
};
