import React from "react";
import GiftsView from "../components/GiftsView";

export default function CustomerGifts() {
  return (
    <div className="customer-gifts-page" style={{ padding: "24px 0" }}>
      <GiftsView role="customer" />
    </div>
  );
}
