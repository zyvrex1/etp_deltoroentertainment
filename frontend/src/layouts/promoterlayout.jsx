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
import PromoterSidebar from "../promotercomponents/promotersidebar.jsx";
import PromoterHeader from "../promotercomponents/promoterheader.jsx";

export default function AdminLayout() {
  const currentUser = {
    name: "Alex Thompson",
    email: "alex@ticketspro.com",
    role: "Super Admin",
  };

  return (
    <div className="app-container">
      <PromoterSidebar />

      <main className="main-content">
        <PromoterHeader user={currentUser} />
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}