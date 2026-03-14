import React from "react";
import { Icon } from "@iconify/react";

const SeatMap = ({
setDetailPopup,
setIsUploadModalOpen,
setIsSeatLayoutOpen,
setIsPricingModalOpen
})=>{

return(

<>

<div className="bt-section">

<div className="bt-section-header">

<h3 className="bt-section-title">
Auditorium Seating
</h3>

<div className="bt-toolbar">

<button
className="outlined-button bt-btn"
onClick={()=>setIsUploadModalOpen(true)}
>
<Icon icon="mdi:upload"/> Upload Map
</button>

<button
className="outlined-button bt-btn"
onClick={()=>setIsSeatLayoutOpen(true)}
>
<Icon icon="mdi:pencil"/> Edit Layout
</button>

</div>

</div>

<div className="bt-seat-layout">
<div className="bt-stage">STAGE</div>
</div>

</div>

<div className="bt-summary">

<button
className="outlined-button bt-btn"
onClick={()=>setIsPricingModalOpen({isOpen:true,type:"seat"})}
>
<Icon icon="mdi:tag-outline"/>
Manage Pricing
</button>

</div>

</>

);
};

export default SeatMap;