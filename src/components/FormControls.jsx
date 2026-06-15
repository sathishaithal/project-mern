import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const formatInputDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isDateBlocked = (date, min, max) =>
  (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) ||
  (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate()));

const getCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

export const AppSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const controlRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={controlRef} className="appControl appSelect">
      <motion.button
        type="button"
        className={`appControlButton ${open ? "appControlButtonActive" : ""}`}
        onClick={() => setOpen((current) => !current)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>{selected?.label}</span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="appSelectMenu"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`appSelectOption ${option.value === value ? "appSelectOptionActive" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.value === value && <i className="bi bi-check2"></i>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AppDatePicker = ({ value, onChange, min, max }) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const controlRef = useRef(null);
  const days = getCalendarDays(month);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const minMonth = min ? new Date(min.getFullYear(), min.getMonth(), 1) : null;
  const maxMonth = max ? new Date(max.getFullYear(), max.getMonth(), 1) : null;

  const isPrevDisabled =
    minMonth &&
    month.getFullYear() === minMonth.getFullYear() &&
    month.getMonth() === minMonth.getMonth();

  const isNextDisabled =
    maxMonth &&
    month.getFullYear() === maxMonth.getFullYear() &&
    month.getMonth() === maxMonth.getMonth();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={controlRef} className="appControl appDatePicker">
      <motion.button
        type="button"
        className={`appControlButton ${open ? "appControlButtonActive" : ""}`}
        onClick={() => {
          setMonth(new Date(value.getFullYear(), value.getMonth(), 1));
          setOpen((current) => !current);
        }}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>{formatInputDate(value)}</span>
        <i className="bi bi-calendar3"></i>
      </motion.button>

      <AnimatePresence>
        {open && (
        <motion.div
          className="appDateMenu"
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="appDateHeader">
            <button
              type="button"
              className="appDateNav"
              disabled={isPrevDisabled}
              onClick={() =>
                !isPrevDisabled &&
                setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="appDateMonth">{formatMonthLabel(month)}</div>
           <button
                type="button"
                className="appDateNav"
                disabled={isNextDisabled}
                onClick={() =>
                  !isNextDisabled &&
                  setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
              >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          <div className="appDateGrid">
            {weekDays.map((day) => (
              <div key={day} className="appDateWeekday">{day}</div>
            ))}
            {days.map((day) => {
              const outsideMonth = day.getMonth() !== month.getMonth();
              const blocked = isDateBlocked(day, min, max);
              const selected = isSameDay(day, value);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  className={`appDateDay ${outsideMonth ? "appDateDayMuted" : ""} ${selected ? "appDateDayActive" : ""}`}
                  disabled={blocked}
                  onClick={() => {
                    onChange(new Date(day));
                    setOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
