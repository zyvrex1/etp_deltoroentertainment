import React from "react";
import { Icon } from "@iconify/react";

const scans = [
{
id:1,
name:"Alice Brown",
details:"VIP • Row A Seat 9",
time:"10:45 AM",
tag:"SEATS",
icon:"mdi:account-outline"
}
];

const LiveScanning = ()=>{

return(

<div className="bt-section">

<h3 className="bt-section-title">
Recent Live Scan Activity
</h3>

<div className="bt-scan-list">

{scans.map(scan=>(
<div key={scan.id} className="bt-scan-card">

<Icon icon={scan.icon} className="bt-scan-icon"/>

<div className="bt-scan-body">

<h5>{scan.name}</h5>

<span>{scan.details}</span>

<span>{scan.time}</span>

</div>

</div>
))}

</div>

</div>

);
};

export default LiveScanning;