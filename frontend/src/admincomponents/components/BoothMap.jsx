import React,{useMemo} from "react";
import {Icon} from "@iconify/react";
import {useDragScroll} from "../utils/useDragScroll";

const BoothMap = ({
setDetailPopup,
setIsUploadModalOpen,
setIsSetupLayoutOpen,
setIsPricingModalOpen,
boothLayoutConfig
})=>{

const boothGridScrollRef = useDragScroll();

return(

<>

<div className="bt-section">

<div className="bt-section-header">

<h3 className="bt-section-title">
Exhibition Hall Layout
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
onClick={()=>setIsSetupLayoutOpen(true)}
>
<Icon icon="mdi:pencil"/> Edit Layout
</button>

</div>
</div>

<div className="bt-grid-outer">

<div
className="bt-booth-grid-wrapper"
ref={boothGridScrollRef}
>

<div className="bt-booth-grid">

<button
className="bt-booth-cell filled status-booked type-vip"
onClick={()=>setDetailPopup({code:"V1"})}
>
V1
</button>

</div>

</div>

</div>

</div>

<div className="bt-summary">

<h3 className="bt-section-title right">
Inventory Summary
</h3>

<button
className="outlined-button bt-btn"
onClick={()=>setIsPricingModalOpen({isOpen:true,type:"booth"})}
>
<Icon icon="mdi:tag-outline"/>
Manage Pricing
</button>

</div>

</>

);

};

export default BoothMap;