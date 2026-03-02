import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./usermanagement.css";
import CreateUserModal from './Modal/CreateUserModal';
import ViewUserModal from './Modal/ViewUserModal';
import EditUserModal from './Modal/EditUserModal';
import { useAuthContext } from "./hooks/useAuthContext";


const UserManagement = () => {
  const { user } = useAuthContext();
  const [allUsers, setAllUsers] = useState([]);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [activeTab, setActiveTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!user?.token) return;

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      const text = await response.text();
      const json = text ? JSON.parse(text) : [];

      if (response.ok) {
        setAllUsers(json);
      } else {
        console.error("Failed to fetch users:", json);
      }

    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  fetchUsers();
}, [user]);

  const tabs = [
    { id: "all-users", label: "All Users", count: allUsers.length },
    { id: "admins", label: "Admins", count: allUsers.filter(u => u.role === "admin").length },
    { id: "customers", label: "Customers", count: allUsers.filter(u => u.role === "customer").length },
    { id: "sponsors", label: "Sponsors", count: allUsers.filter(u => u.role === "sponsor").length },
    { id: "promoters", label: "Promoters", count: allUsers.filter(u => u.role === "promoter").length },
  ];

  const getInitial = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  const getUserStatus = (lastLogin) => {
    if (!lastLogin) return "inactive"; // never logged in
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffInDays = (now - lastLoginDate) / (1000 * 60 * 60 * 24);

    // Example: consider inactive if no login in 30 days
    return diffInDays <= 30 ? "active" : "inactive";
  };

  const getTableData = () => {
    switch (activeTab) {
      case "all-users":
        return allUsers;
      case "admins":
        return allUsers.filter(u => u.role === "admin");
      case "customers":
        return allUsers.filter(u => u.role === "customer");
      case "promoters":
        return allUsers.filter(u => u.role === "promoter");
      case "sponsors":
        return allUsers.filter(u => u.role === "sponsor");
      default:
        return [];
    }
  };

  const filteredData = getTableData().filter(item => {
    const searchStr = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(searchStr)) ||
      (item.email && item.email.toLowerCase().includes(searchStr)) ||
      (item.contact && item.contact.toLowerCase().includes(searchStr)) ||
      (item.company && item.company.toLowerCase().includes(searchStr))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchQuery("");
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

  const renderTable = () => {
    if (activeTab === "all-users" || activeTab === "admins") {
      return (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => (
                <tr key={user._id}>
                  <td data-label="User">
                    <div className="user-cell">
                      <span className="avatar">{getInitial(user.firstName, user.lastName)}</span>
                      <div>
                        <h5 className="user-name">{user.firstName} {user.lastName}</h5>
                      </div>
                    </div>
                  </td>
                  <td>
                    <h5 className="smaller-body-text">{user.email}</h5>
                  </td>
                  <td data-label="Role">
                    <span className="button-label role-badge">{user.role}</span>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`button-label status-${getUserStatus(user.lastLogin)}`}
                      style={{
                        backgroundColor:
                          getUserStatus(user.lastLogin) === "active" ? "green" : "gray"
                      }}
                    >
                      {getUserStatus(user.lastLogin).charAt(0).toUpperCase() + getUserStatus(user.lastLogin).slice(1)}
                    </span>
                  </td>
                  <td data-label="Joined" className="small-body-text">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="action-btn view-btn" onClick={() => handleViewUser(user)}>
                        <Icon icon="mdi:eye" />
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEditUser(user)}>
                        <Icon icon="mdi:pencil" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "customers") {
      return (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Total Spent</th>
                <th>Tickets</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((customer) => (
                <tr key={customer.id}>
                  <td data-label="Customer">
                    <div className="user-cell">
                      <span className="avatar green">{getInitial(customer.name)}</span>
                      <div>
                        <h5 className="user-name">{customer.name}</h5>
                        <p className="smaller-body-text">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`button-label status-${getUserStatus(user.lastLogin)}`}
                      style={{
                        backgroundColor:
                          getUserStatus(user.lastLogin) === "active" ? "green" : "gray"
                      }}
                    >
                      {getUserStatus(user.lastLogin).charAt(0).toUpperCase() + getUserStatus(user.lastLogin).slice(1)}
                    </span>
                  </td>
                  <td data-label="Joined" className="small-body-text">{customer.joined}</td>
                  <td data-label="Total Spent" className="regular-body-text">{customer.totalSpent}</td>
                  <td data-label="Tickets" className="small-body-text">{customer.tickets}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="action-btn view-btn" onClick={() => handleViewUser(customer)}>
                        <Icon icon="mdi:eye" />
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEditUser(customer, 'customer')}>
                        <Icon icon="mdi:pencil" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "promoters") {
      return (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Events</th>
                <th>Revenue</th>
                <th>Paid Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((promoter) => (
                <tr key={promoter.id}>
                  <td data-label="Organization">
                    <div className="user-cell">
                      <span className="avatar purple">
                        <Icon icon="mdi:briefcase" />
                      </span>
                      <div>
                        <h5 className="user-name">{promoter.name}</h5>
                        <p className="smaller-body-text">{promoter.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Events" className="small-body-text">{promoter.events}</td>
                  <td data-label="Revenue" className="regular-body-text revenue">{promoter.revenue}</td>
                  <td data-label="Paid Out" className="regular-body-text paid-out">{promoter.paidOut}</td>
                  <td data-label="Status">
                    <span
                      className={`button-label status-${getUserStatus(user.lastLogin)}`}
                      style={{
                        backgroundColor:
                          getUserStatus(user.lastLogin) === "active" ? "green" : "gray"
                      }}
                    >
                      {getUserStatus(user.lastLogin).charAt(0).toUpperCase() + getUserStatus(user.lastLogin).slice(1)}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="action-btn view-btn" onClick={() => handleViewUser(promoter)}>
                        <Icon icon="mdi:eye" />
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEditUser(promoter, 'promoter')}>
                        <Icon icon="mdi:pencil" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "sponsors") {
      return (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Booths</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td data-label="Company">
                    <div className="user-cell">
                      <span className="avatar blue">
                        <Icon icon="mdi:office-building" />
                      </span>
                      <div>
                        <h5 className="user-name">{sponsor.company}</h5>
                        <p className="smaller-body-text">{sponsor.industry}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Contact">
                    <div>
                      <p className="large-body-text user-name">{sponsor.contact}</p>
                    </div>
                  </td>
                  <td className="small-body-text" data-label="Booths">{sponsor.booths}</td>
                  <td className="regular-body-text" data-label="Total Spent">{sponsor.totalSpent}</td>
                  <td data-label="Status">
                    <span
                      className={`button-label status-${getUserStatus(user.lastLogin)}`}
                      style={{
                        backgroundColor:
                          getUserStatus(user.lastLogin) === "active" ? "green" : "gray"
                      }}
                    >
                      {getUserStatus(user.lastLogin).charAt(0).toUpperCase() + getUserStatus(user.lastLogin).slice(1)}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="actions">
                      <button className="action-btn view-btn" onClick={() => handleViewUser(sponsor)}>
                        <Icon icon="mdi:eye" />
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEditUser(sponsor, 'sponsor')}>
                        <Icon icon="mdi:pencil" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="user-management">
      <div className="usermanagement-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all platform users in one place.</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button" onClick={() => setIsUserModalOpen(true)}>Create User</button>
        </div>
      </div>

      <div className="um-content">
        {/* Tabs */}
        <div className="tabs-search-row">
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon icon={tab.id === "all-users" ? "mdi:account-multiple" : tab.id === "admins" ? "mdi:shield-account" : tab.id === "customers" ? "mdi:account" : tab.id === "sponsors" ? "mdi:office-building" : "mdi:briefcase"} />
              <span>{tab.label}</span>
              <span className="badge-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="outlined-button search-container">
          <Icon icon="mdi:magnify" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
      <CreateUserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
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
