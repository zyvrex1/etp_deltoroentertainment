// import { Outlet } from "react-router-dom";
// import PromoterSidebar from "../promotercomponents/promotersidebar";
// // import PromoterHeader from "../promotercomponents/header";

// export default function PromoterLayout() {
//   const currentUser = {
//     name: "John Promoter",
//     role: "Promoter"
//   };

//   return (
//     <div style={{ display: "flex" }}>
//       <PromoterSidebar />

//       <div style={{ flex: 1 }}>
//         <PromoterHeader user={currentUser} />
//         <div style={{ padding: "20px" }}>
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }

import { Outlet } from "react-router-dom";
import PromoterSidebar from "../promotercomponents/promotersidebar";

export default function PromoterLayout() {
  return (
    <div style={{ display: "flex" }}>
      <PromoterSidebar />

      <div style={{ flex: 1 }}>
        <div style={{ padding: "20px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}