import { Outlet } from "react-router-dom";
import CustomerHeader from "../customercomponents/CustomerHeader.jsx";
import CustomerFooter from "../customercomponents/CustomerFooter.jsx";

export default function CustomerLayout() {
    const currentUser = {
        name: "Zyvrex Perez",
        email: "zyvrex.p@example.com",
        role: "Customer",
    };

    return (
        <div className="customer-app-container">
            {/* Global Header */}
            <CustomerHeader user={currentUser} />

            {/* Page Content */}
            <main className="customer-main-content">
                <div className="customer-content-wrapper">
                    <Outlet />
                </div>
            </main>

            {/* Global Footer */}
            <CustomerFooter />
        </div>
    );
}
