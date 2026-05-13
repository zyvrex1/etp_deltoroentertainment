import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
import CustomerOrderQrModal from './Modal/CustomerOrderQrModal';
import './CustomerOrders.css';


const MOCK_ORDERS = [
    {
        id: "ORD-8902",
        time: "03:15 AM",
        date: "May 14, 2026",
        status: "Ready for Pickup",
        storeName: "Burger Stand",
        boothInfo: "Booth - 1",
        itemsCount: 3,
        itemsDetail: "Burger Combo x2, Fries x1",
        eventName: "Neon Dreams Tour",
        total: 29.00,
        purchasedAt: "2026-05-14T03:15:00"
    },
    {
        id: "ORD-8901",
        time: "02:45 AM",
        date: "May 14, 2026",
        status: "Preparing",
        storeName: "Pizza Palace",
        boothInfo: "Booth - 5",
        itemsCount: 2,
        itemsDetail: "Pepperoni Pizza x1, Coke x2",
        eventName: "Neon Dreams Tour",
        total: 18.50,
        purchasedAt: "2026-05-14T02:45:00"
    },
    {
        id: "ORD-8895",
        time: "08:30 PM",
        date: "May 13, 2026",
        status: "Completed",
        storeName: "Merch Hub",
        boothInfo: "Booth - A12",
        itemsCount: 1,
        itemsDetail: "Official Tour T-Shirt x1",
        eventName: "Neon Dreams Tour",
        total: 35.00,
        purchasedAt: "2026-05-13T20:30:00"
    }
];

const CustomerOrders = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortFilter, setSortFilter] = useState("Recent");

    const [qrModalShow, setQrModalShow] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const handleEnlargeQr = (order) => {
        setSelectedOrder(order);
        setQrModalShow(true);
    };

    const filteredAndSortedOrders = useMemo(() => {

        let result = [...MOCK_ORDERS];

        // Search Filter
        if (searchQuery) {
            result = result.filter(order =>
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.itemsDetail.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status Filter
        if (statusFilter !== "All") {
            result = result.filter(order => order.status === statusFilter);
        }

        // Sort
        if (sortFilter === "Recent") {
            result.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
        } else if (sortFilter === "Price: Low to High") {
            result.sort((a, b) => a.total - b.total);
        } else if (sortFilter === "Price: High to Low") {
            result.sort((a, b) => b.total - a.total);
        }

        return result;
    }, [searchQuery, statusFilter, sortFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Ready for Pickup': return 'status-ready';
            case 'Preparing': return 'status-preparing';
            case 'Completed': return 'status-completed';
            default: return 'status-pending';
        }
    };

    return (
        <div className="customer-orders-wrapper">
            <div className="customer-orders-container">
                <div className="orders-header-nav">
                    <span className="orders-breadcrumb" onClick={() => navigate('/customer/settings')}>Profile</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="orders-breadcrumb-current">My Orders</span>
                </div>

                <div className="orders-header">
                    <h2>My Orders</h2>
                    <p className="regular-body-text text-secondary">Track your food, drinks, and merchandise purchases</p>
                </div>


                <div className="orders-toolbar">
                    <div className="search-box">
                        <Icon icon="mdi:magnify" width="20" />
                        <input
                            type="text"
                            placeholder="Search by order ID, store, items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-filters">
                        <div className="filter-dropdown-wrapper">
                            <Icon icon="mdi:filter-variant" className="filter-icon" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="status-dropdown"
                            >
                                <option value="All">All Status</option>
                                <option value="Preparing">Preparing</option>
                                <option value="Ready for Pickup">Ready for Pickup</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <Icon icon="mdi:sort-variant" className="filter-icon" />
                            <select
                                value={sortFilter}
                                onChange={(e) => setSortFilter(e.target.value)}
                                className="status-dropdown"
                            >
                                <option value="Recent">Recently Ordered</option>
                                <option value="Price: Low to High">Price: Low to High</option>
                                <option value="Price: High to Low">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="orders-list">
                    {paginatedOrders.length > 0 ? (
                        paginatedOrders.map(order => (
                            <div className="order-card-new" key={order.id}>
                                <div className="order-card-top">
                                    <h4 className="order-id-title">{order.id}</h4>
                                    <span className={`order-status-badge smaller-body-text ${getStatusBadgeClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-card-body">
                                    <div className="order-image-container">
                                        <div className="store-placeholder-icon">
                                            <Icon icon="mdi:store-outline" width="40" />
                                        </div>
                                    </div>
                                    <div className="order-details">
                                        <div className="order-info-main">
                                            <h5 className="store-name-text">{order.storeName}</h5>
                                            <div className="order-info-row smaller-body-text">
                                                <Icon icon="mdi:map-marker-outline" width="14" />
                                                <span>{order.boothInfo}</span>
                                            </div>
                                            <div className="order-info-row smaller-body-text">
                                                <Icon icon="mdi:calendar-outline" width="14" />
                                                <span>{order.date} • {order.time}</span>
                                            </div>
                                        </div>
                                        <div className="order-items-summary">
                                            <p className="items-text small-body-text">
                                                <strong>Items ({order.itemsCount}):</strong> {order.itemsDetail}
                                            </p>
                                            <p className="event-context-text smaller-body-text">{order.eventName}</p>
                                        </div>
                                    </div>

                                    <div className="order-qr-section" onClick={() => handleEnlargeQr(order)} style={{ cursor: 'pointer' }}>

                                        <div className="order-qr-wrapper">

                                            <QRCodeCanvas
                                                value={order.id}
                                                size={110}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"M"}
                                            />

                                        </div>
                                    </div>
                                </div>
                                <div className="order-card-footer">
                                    <div className="order-total-display">
                                        <span className="total-label smaller-body-text">Total Amount</span>
                                        <span className="total-value h4">${order.total.toFixed(2)}</span>
                                    </div>
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Icon icon="mdi:shopping-search" width="48" />
                            <p>No orders found. Start by browsing the store!</p>
                            <button className="browse-store-btn" onClick={() => navigate('/customer/store')}>
                                Browse Stores
                            </button>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <span className="pagination-info">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <CustomerOrderQrModal
                show={qrModalShow}
                onClose={() => setQrModalShow(false)}
                orderData={selectedOrder}
            />
        </div>
    );
};


export default CustomerOrders;
