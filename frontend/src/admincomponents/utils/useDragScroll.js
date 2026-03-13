import { useEffect, useRef } from "react";

export const useDragScroll = () => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const ele = scrollRef.current;
    if (!ele) return;

    let isDragging = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.pageX - ele.offsetLeft;
      startY = e.pageY - ele.offsetTop;
      scrollLeft = ele.scrollLeft;
      scrollTop = ele.scrollTop;
      ele.style.cursor = "grabbing";
      ele.style.userSelect = "none";
    };

    const handleMouseLeave = () => {
      isDragging = false;
      ele.style.cursor = "auto";
      ele.style.userSelect = "auto";
    };

    const handleMouseUp = () => {
      isDragging = false;
      ele.style.cursor = "auto";
      ele.style.userSelect = "auto";
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - ele.offsetLeft;
      const y = e.pageY - ele.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      ele.scrollLeft = scrollLeft - walkX;
      ele.scrollTop = scrollTop - walkY;
    };

    ele.addEventListener("mousedown", handleMouseDown);
    ele.addEventListener("mouseleave", handleMouseLeave);
    ele.addEventListener("mouseup", handleMouseUp);
    ele.addEventListener("mousemove", handleMouseMove);

    return () => {
      ele.removeEventListener("mousedown", handleMouseDown);
      ele.removeEventListener("mouseleave", handleMouseLeave);
      ele.removeEventListener("mouseup", handleMouseUp);
      ele.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return scrollRef;
};
