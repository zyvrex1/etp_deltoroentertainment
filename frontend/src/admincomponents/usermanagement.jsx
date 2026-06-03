import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./usermanagement.css";
import CreateUserModal from "./Modal/CreateUserModal";
import ViewUserModal from "./Modal/ViewUserModal";
import EditUserModal from "./Modal/EditUserModal";
import { useAuthContext } from "../hooks/useAuthContext";
import adminService from "../services/adminService";

const UserManagement = () => {
  const { user } = useAuthContext();
  const [allUsers, setAllUsers] = useState([]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState("");
  const [activeTab, setActiveTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [expandedRow, setExpandedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const topRef = useRef(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const fetchUsers = async () => {
    if (!user?.token) return;
    setIsLoading(true);

    try {
      const json = await adminService.getUsers(user.token);
      setAllUsers(json);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const usersExcludingCurrent = allUsers.filter(u => u._id !== user._id);

  const tabs = [
    { id: "all-users", label: "All Users", count: usersExcludingCurrent.length },
    {
      id: "admins",
      label: "Admins",
      count: usersExcludingCurrent.filter((u) => u.role === "admin").length,
    },
    {
      id: "promoters",
      label: "Promoters",
      count: usersExcludingCurrent.filter((u) => u.role === "promoter").length,
    },
    {
      id: "sponsors",
      label: "Sponsors",
      count: usersExcludingCurrent.filter((u) => u.role === "sponsor").length,
    },
    {
      id: "customers",
      label: "Customers",
      count: usersExcludingCurrent.filter((u) => u.role === "customer").length,
    },
  ];

  const getInitial = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const Avatar = ({ person }) => {
    const [imgError, setImgError] = useState(false);
    const avatarPath = person.avatar;

    const getFullUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${backendUrl}${cleanPath}`;
    };

    const avatarUrl = !imgError ? getFullUrl(avatarPath) : null;

    if (avatarUrl) {
      return (
        <span className="avatar has-image">
          <img
            src={avatarUrl}
            alt=""
            onError={() => setImgError(true)}
          />
        </span>
      );
    }

    return (
      <span className="avatar">
        {getInitial(person.firstName, person.lastName)}
      </span>
    );
  };

  const getUserStatus = (lastLogin) => {
    if (!lastLogin) return "inactive"; // never logged in
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffInDays = (now - lastLoginDate) / (1000 * 60 * 60 * 24);

    // Example: consider inactive if no login in 30 days
    return diffInDays <= 30 ? "active" : "inactive";
  };

  const getStatusText = (lastLogin) => {
    const status = getUserStatus(lastLogin);
    if (!lastLogin) return "Inactive";
    
    if (status === "inactive") {
      const lastLoginDate = new Date(lastLogin);
      const now = new Date();
      const diffInDays = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));
      return `Inactive - ${diffInDays} days`;
    }
    
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTableData = () => {
    // Filter out the logged-in user first
    let usersExcludingCurrent = allUsers.filter(u => u._id !== user._id);

    // Sort by createdAt descending (recently created first)
    usersExcludingCurrent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    switch (activeTab) {
      case "all-users":
        return usersExcludingCurrent;
      case "admins":
        return usersExcludingCurrent.filter((u) => u.role === "admin");
      case "customers":
        return usersExcludingCurrent.filter((u) => u.role === "customer");
      case "promoters":
        return usersExcludingCurrent.filter((u) => u.role === "promoter");
      case "sponsors":
        return usersExcludingCurrent.filter((u) => u.role === "sponsor");
      default:
        return [];
    }
  };

  const filteredData = getTableData().filter((item) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      `${item.firstName || ""} ${item.lastName || ""}`
        .toLowerCase()
        .includes(searchStr) ||
      (item.email && item.email.toLowerCase().includes(searchStr))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedRow(null);
      if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchQuery("");
    setExpandedRow(null);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewUserModalOpen(true);
  };

  const handleEditUser = (user, type) => {
    setSelectedUser(user);

    let userType = type;
    if (!userType && user.role) {
      userType = user.role.toLowerCase();
    }

    setSelectedUserType(userType);
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!user?.token) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${userToDelete.firstName} ${userToDelete.lastName}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await adminService.deleteUser(userToDelete._id, user.token);
      // Refresh the list
      await fetchUsers();
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.message || "Failed to delete user.");
    }
  };

  const renderEmptyState = (type) => {
    let icon = "mdi:account-off";
    let title = `No ${type} yet`;
    let message = `There are currently no ${type} registered.`;

    if (searchQuery) {
      title = "No users found";
      message = `No users match "${searchQuery}".`;
    }

    switch (type) {
      case "admins": icon = "mdi:shield-off"; break;
      case "customers": icon = "mdi:account-off"; break;
      case "promoters": icon = "mdi:briefcase-remove"; break;
      case "sponsors": icon = "mdi:office-building-remove"; break;
      default: icon = "mdi:account-multiple-remove";
    }

    return (
      <div className="empty-state">
        <Icon icon={icon} style={{ fontSize: '48px', marginBottom: '16px' }} />
        <h4>{title}</h4>
        <p className="small-body-text">{message}</p>
      </div>
    );
  };

  const renderTable = () => {
    if (activeTab === "all-users" || activeTab === "admins") {
      return (
        <div className="table-wrapper">
          {isLoading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ gap: '12px' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        <div className="skeleton skeleton-text title" style={{ width: '120px', marginBottom: 0 }} />
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            renderEmptyState(activeTab === "admins" ? "admins" : "users")
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((user) => (
                  <tr key={user._id} className={expandedRow === user._id ? "expanded" : ""}>
                    <td data-label="User" className="id-td">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(user._id)}>
                        <Icon icon={expandedRow === user._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="user-cell">
                        <Avatar person={user} />
                        <div>
                          <h5 className="user-name">
                            {user.firstName} {user.lastName}
                          </h5>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email" className="name-td">
                      <h5 className="smaller-body-text">{user.email}</h5>
                    </td>
                    <td data-label="Phone" className="small-body-text">
                      {user.phone || "N/A"}
                    </td>
                    <td data-label="Role">
                      <span className="button-label role-badge">{user.role}</span>
                    </td>
                    <td data-label="Joined" className="small-body-text">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td data-label="Status">
                      <span
                         className={`button-label em-status-${getUserStatus(user.lastLogin)}`}

                      >
                        {getStatusText(user.lastLogin)}
                      </span>
                    </td>

                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewUser(user)}
                          title="View User"
                        >
                          <Icon icon="mdi:eye" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        {getUserStatus(user.lastLogin) === "inactive" && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete Inactive User"
                            style={{ color: "#ff4d4f" }}
                          >
                            <Icon icon="mdi:trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === "customers") {
      return (
        <div className="table-wrapper">
          {isLoading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ gap: '12px' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        <div className="skeleton skeleton-text title" style={{ width: '120px', marginBottom: 0 }} />
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            renderEmptyState(activeTab)
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((customer) => (
                  <tr key={customer._id} className={expandedRow === customer._id ? "expanded" : ""}>
                    <td data-label="Customer" className="id-td">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(customer._id)}>
                        <Icon icon={expandedRow === customer._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="user-cell">
                        <Avatar person={customer} />
                        <div>
                          <h5 className="user-name">
                            {customer.firstName} {customer.lastName}
                          </h5>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email" className="name-td">
                      <h5 className="smaller-body-text">{customer.email}</h5>
                    </td>
                    <td data-label="Phone" className="small-body-text">
                      {customer.phone || "N/A"}
                    </td>
                    <td data-label="Total Spent" className="regular-body-text">
                      {customer.roleDetails.totalSpent}
                    </td>
                    <td data-label="Joined" className="small-body-text">
                      {new Date(customer.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`button-label em-status-${getUserStatus(customer.lastLogin)}`}
                      >
                        {getStatusText(customer.lastLogin)}
                      </span>
                    </td>

                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewUser(customer)}
                          title="View User"
                        >
                          <Icon icon="mdi:eye" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(customer, 'customer')}
                          title="Edit User"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        {getUserStatus(customer.lastLogin) === "inactive" && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(customer)}
                            title="Delete Inactive User"
                            style={{ color: "#ff4d4f" }}
                          >
                            <Icon icon="mdi:trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === "promoters") {
      return (
        <div className="table-wrapper">
          {isLoading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ gap: '12px' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        <div className="skeleton skeleton-text title" style={{ width: '120px', marginBottom: 0 }} />
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            renderEmptyState(activeTab)
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((promoter) => (
                  <tr key={promoter._id} className={expandedRow === promoter._id ? "expanded" : ""}>
                    <td data-label="User" className="id-td">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(promoter._id)}>
                        <Icon icon={expandedRow === promoter._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="user-cell">
                        <Avatar person={promoter} />
                        <div>
                          <h5 className="user-name">
                            {promoter.firstName} {promoter.lastName}
                          </h5>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email" className="name-td">
                      <h5 className="smaller-body-text">{promoter.email}</h5>
                    </td>
                    <td data-label="Organization" className="small-body-text">
                      {promoter.companyName || "N/A"}
                    </td>
                    <td data-label="Phone" className="small-body-text">
                      {promoter.phone || "N/A"}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`button-label em-status-${getUserStatus(promoter.lastLogin)}`}
                      >
                        {getStatusText(promoter.lastLogin)}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewUser(promoter)}
                          title="View User"
                        >
                          <Icon icon="mdi:eye" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(promoter, 'promoter')}
                          title="Edit User"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        {getUserStatus(promoter.lastLogin) === "inactive" && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(promoter)}
                            title="Delete Inactive User"
                            style={{ color: "#ff4d4f" }}
                          >
                            <Icon icon="mdi:trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === "sponsors") {
      return (
        <div className="table-wrapper">
          {isLoading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="user-cell" style={{ gap: '12px' }}>
                        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        <div className="skeleton skeleton-text title" style={{ width: '120px', marginBottom: 0 }} />
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : paginatedData.length === 0 ? (
            renderEmptyState(activeTab)
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((sponsor) => (
                  <tr key={sponsor._id} className={expandedRow === sponsor._id ? "expanded" : ""}>
                    <td data-label="User" className="id-td">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(sponsor._id)}>
                        <Icon icon={expandedRow === sponsor._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="user-cell">
                        <Avatar person={sponsor} />
                        <div>
                          <h5 className="user-name">
                            {sponsor.firstName} {sponsor.lastName}
                          </h5>
                        </div>
                      </div>
                    </td>
                    <td data-label="Email" className="name-td">
                      <h5 className="smaller-body-text">{sponsor.email}</h5>
                    </td>
                    <td data-label="Organization" className="small-body-text">
                      {sponsor.companyName || "N/A"}
                    </td>
                    <td data-label="Phone" className="small-body-text">
                      {sponsor.phone || "N/A"}
                    </td>
                    <td data-label="Status">
                      <span
                        className={`button-label em-status-${getUserStatus(sponsor.lastLogin)}`}
                      >
                        {getStatusText(sponsor.lastLogin)}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewUser(sponsor)}
                          title="View User"
                        >
                          <Icon icon="mdi:eye" />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(sponsor, 'sponsor')}
                          title="Edit User"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        {getUserStatus(sponsor.lastLogin) === "inactive" && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(sponsor)}
                            title="Delete Inactive User"
                            style={{ color: "#ff4d4f" }}
                          >
                            <Icon icon="mdi:trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }
  };

  return (
    <div className="user-management">
      <div className="usermanagement-header" ref={topRef}>
        <div>
          <h1>User Management</h1>
          <p>Manage all platform users in one place.</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="primary-button"
            onClick={() => setIsUserModalOpen(true)}
          >
            <Icon icon="mdi:plus" /> Create User
          </button>
        </div>
      </div>

      <div className="um-content">
        {/* Tabs */}
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon
                icon={
                  tab.id === "all-users"
                    ? "mdi:account-multiple"
                    : tab.id === "admins"
                      ? "mdi:shield-account"
                      : tab.id === "customers"
                        ? "mdi:account"
                        : tab.id === "sponsors"
                          ? "mdi:office-building"
                          : "mdi:briefcase"
                }
              />
              <span>{tab.label}</span>
              <span className="badge-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="um-toolbar">
          <div className="um-toolbar-left">
            <div className="um-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // ✅ IMPORTANT (same as EventManagement)
                }}
                className="small-body-text"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {renderTable()}

        {/* Pagination */}
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
      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onUserCreated={fetchUsers}
      />
      <ViewUserModal
        isOpen={isViewUserModalOpen}
        onClose={() => setIsViewUserModalOpen(false)}
        user={selectedUser}
      />
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        user={selectedUser}
        type={selectedUserType}
      />
    </div>
  );
};

export default UserManagement;
