import { useState } from "react";
import { Icon } from "@iconify/react";
import "./usermanagement.css";
import CreateUserModal from './Modal/CreateUserModal';
import ViewUserModal from './Modal/ViewUserModal';
import EditUserModal from './Modal/EditUserModal';


const UserManagement = () => {

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [activeTab, setActiveTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // All Users Data
  const allUsers = [
    { id: 1, name: "Alex Thompson", email: "alex@ticketspro.com", role: "Admin", status: "active", joined: "Jan 15, 2023" },
    { id: 2, name: "Jessica Martinez", email: "jessica@ticketspro.com", role: "Promoter", status: "active", joined: "Feb 20, 2023" },
    { id: 3, name: "Robert Chen", email: "robert@ticketspro.com", role: "Sponsor", status: "active", joined: "Mar 15, 2023" },
    { id: 4, name: "Amanda Foster", email: "amanda@ticketspro.com", role: "Customer", status: "active", joined: "Apr 10, 2023" },
    { id: 5, name: "Michael Brown", email: "michael@ticketspro.com", role: "Admin", status: "pending", joined: "May 5, 2023" },
    { id: 6, name: "Sarah Johnson", email: "sarah@ticketspro.com", role: "Customer", status: "active", joined: "May 12, 2023" },
    { id: 7, name: "David Wilson", email: "david@ticketspro.com", role: "Promoter", status: "active", joined: "Jun 1, 2023" },
    { id: 8, name: "Emma Davis", email: "emma@ticketspro.com", role: "Sponsor", status: "active", joined: "Jun 18, 2023" },
    { id: 9, name: "James Miller", email: "james@ticketspro.com", role: "Customer", status: "suspended", joined: "Jul 2, 2023" },
    { id: 10, name: "Lisa Anderson", email: "lisa@ticketspro.com", role: "Admin", status: "active", joined: "Jul 15, 2023" },
    { id: 11, name: "Chris Taylor", email: "chris@ticketspro.com", role: "Promoter", status: "active", joined: "Aug 5, 2023" },
    { id: 12, name: "Rachel White", email: "rachel@ticketspro.com", role: "Customer", status: "active", joined: "Aug 20, 2023" },
    { id: 13, name: "Mark Harris", email: "mark@ticketspro.com", role: "Sponsor", status: "pending", joined: "Sep 10, 2023" },
    { id: 14, name: "Nicole Clark", email: "nicole@ticketspro.com", role: "Customer", status: "active", joined: "Sep 22, 2023" },
    { id: 15, name: "Kevin Lewis", email: "kevin@ticketspro.com", role: "Admin", status: "active", joined: "Oct 1, 2023" },
    { id: 16, name: "Jennifer Lee", email: "jennifer@ticketspro.com", role: "Promoter", status: "active", joined: "Oct 15, 2023" },
    { id: 17, name: "Brian Walker", email: "brian@ticketspro.com", role: "Customer", status: "active", joined: "Nov 5, 2023" },
    { id: 18, name: "Amanda Hall", email: "amanda.h@ticketspro.com", role: "Sponsor", status: "active", joined: "Nov 18, 2023" },
    { id: 19, name: "Ryan Young", email: "ryan@ticketspro.com", role: "Customer", status: "active", joined: "Dec 2, 2023" },
    { id: 20, name: "Sophie King", email: "sophie@ticketspro.com", role: "Admin", status: "active", joined: "Dec 15, 2023" },
    { id: 21, name: "Daniel Wright", email: "daniel.w@ticketspro.com", role: "Promoter", status: "active", joined: "Jan 5, 2024" },
    { id: 22, name: "Catherine Lopez", email: "catherine@ticketspro.com", role: "Customer", status: "pending", joined: "Jan 18, 2024" },
    { id: 23, name: "Thomas Hill", email: "thomas@ticketspro.com", role: "Sponsor", status: "active", joined: "Feb 1, 2024" },
    { id: 24, name: "Laura Scott", email: "laura@ticketspro.com", role: "Customer", status: "active", joined: "Feb 10, 2024" },
    { id: 25, name: "Andrew Green", email: "andrew@ticketspro.com", role: "Admin", status: "active", joined: "Feb 20, 2024" },
    { id: 26, name: "Jessica Adams", email: "jessica.a@ticketspro.com", role: "Promoter", status: "active", joined: "Mar 1, 2024" },
    { id: 27, name: "Paul Nelson", email: "paul@ticketspro.com", role: "Customer", status: "active", joined: "Mar 12, 2024" },
    { id: 28, name: "Michelle Carter", email: "michelle@ticketspro.com", role: "Sponsor", status: "active", joined: "Mar 25, 2024" },
    { id: 29, name: "George Roberts", email: "george@ticketspro.com", role: "Customer", status: "active", joined: "Apr 5, 2024" },
    { id: 30, name: "Angela Phillips", email: "angela@ticketspro.com", role: "Admin", status: "active", joined: "Apr 15, 2024" },
    { id: 31, name: "Edward Campbell", email: "edward@ticketspro.com", role: "Promoter", status: "active", joined: "Apr 28, 2024" },
    { id: 32, name: "Maria Parker", email: "maria.p@ticketspro.com", role: "Customer", status: "active", joined: "May 5, 2024" },
    { id: 33, name: "Joseph Evans", email: "joseph@ticketspro.com", role: "Sponsor", status: "suspended", joined: "May 18, 2024" },
    { id: 34, name: "Linda Edwards", email: "linda@ticketspro.com", role: "Customer", status: "active", joined: "May 30, 2024" },
  ];

  // Customers Data
  const customers = [
    { id: 1, name: "Emily Blunt", email: "emily@gmail.com", status: "active", joined: "May 5, 2023", totalSpent: "$598.00", tickets: 1 },
    { id: 2, name: "James Wilson", email: "james@yahoo.com", status: "active", joined: "Jun 12, 2023", totalSpent: "$299.00", tickets: 1 },
    { id: 3, name: "Sophia Garcia", email: "sophia@hotmail.com", status: "active", joined: "Jul 20, 2023", totalSpent: "$150.00", tickets: 1 },
    { id: 4, name: "Daniel Lee", email: "daniel@gmail.com", status: "suspended", joined: "Aug 15, 2023", totalSpent: "$150.00", tickets: 1 },
    { id: 5, name: "Olivia Martinez", email: "olivia@outlook.com", status: "active", joined: "Sep 1, 2023", totalSpent: "$150.00", tickets: 1 },
    { id: 6, name: "Mason Taylor", email: "mason@mail.com", status: "active", joined: "Sep 15, 2023", totalSpent: "$450.00", tickets: 2 },
    { id: 7, name: "Ava Johnson", email: "ava@gmail.com", status: "active", joined: "Oct 1, 2023", totalSpent: "$299.00", tickets: 1 },
    { id: 8, name: "Ethan Brown", email: "ethan@yahoo.com", status: "active", joined: "Oct 15, 2023", totalSpent: "$750.00", tickets: 3 },
    { id: 9, name: "Isabella Davis", email: "isabella@hotmail.com", status: "active", joined: "Nov 2, 2023", totalSpent: "$200.00", tickets: 1 },
    { id: 10, name: "Liam Anderson", email: "liam@mail.com", status: "pending", joined: "Nov 15, 2023", totalSpent: "$0.00", tickets: 0 },
    { id: 11, name: "Mia Wilson", email: "mia@gmail.com", status: "active", joined: "Nov 28, 2023", totalSpent: "$350.00", tickets: 2 },
    { id: 12, name: "Noah Martinez", email: "noah@yahoo.com", status: "active", joined: "Dec 10, 2023", totalSpent: "$450.00", tickets: 1 },
    { id: 13, name: "Charlotte Taylor", email: "charlotte@hotmail.com", status: "active", joined: "Dec 22, 2023", totalSpent: "$599.00", tickets: 2 },
    { id: 14, name: "Benjamin Lee", email: "benjamin@mail.com", status: "active", joined: "Jan 5, 2024", totalSpent: "$299.00", tickets: 1 },
    { id: 15, name: "Amelia Clark", email: "amelia@gmail.com", status: "active", joined: "Jan 18, 2024", totalSpent: "$100.00", tickets: 1 },
  ];

  // Promoters Data
  const promoters = [
    { id: 1, name: "TechStart Inc", contact: "sarah@techstart.com", events: 2, revenue: "$178,550.00", paidOut: "$5,000.00", status: "active" },
    { id: 2, name: "MusicFest LLC", contact: "david@musicfest.com", events: 2, revenue: "$250,000.00", paidOut: "$7,000.00", status: "active" },
    { id: 3, name: "EventPro Solutions", contact: "maria@eventpro.com", events: 1, revenue: "$1,500.00", paidOut: "$0.00", status: "pending" },
    { id: 4, name: "ConferenceMasters", contact: "kevin@confmasters.com", events: 1, revenue: "$0.00", paidOut: "$0.00", status: "suspended" },
    { id: 5, name: "Art Gala Inc", contact: "isa@artgala.com", events: 2, revenue: "$227,500.00", paidOut: "$20,000.00", status: "active" },
    { id: 6, name: "ConcertWave Events", contact: "alex@concertwave.com", events: 3, revenue: "$350,000.00", paidOut: "$15,000.00", status: "active" },
  ];

  // Sponsors Data
  const sponsors = [
    { id: 1, company: "Global Corp", contact: "Mike Ross", industry: "Technology", booths: 1, totalSpent: "$5,000.00", status: "active" },
    { id: 2, company: "TechVentures Inc", contact: "Lisa Wang", industry: "Venture Capital", booths: 1, totalSpent: "$3,500.00", status: "active" },
    { id: 3, company: "MediaMax Group", contact: "John Smith", industry: "Media", booths: 1, totalSpent: "$2,000.00", status: "active" },
    { id: 4, company: "StartupHub", contact: "Rachel Green", industry: "Incubator", booths: 0, totalSpent: "$0.00", status: "active" },
    { id: 5, company: "Action Movies", contact: "Tom Cruise", industry: "Entertainment", booths: 0, totalSpent: "$0.00", status: "pending" },
    { id: 6, company: "PowerTech Solutions", contact: "Jennifer Lee", industry: "Technology", booths: 2, totalSpent: "$8,500.00", status: "active" },
    { id: 7, company: "Creative Studio", contact: "Mark Johnson", industry: "Design", booths: 1, totalSpent: "$4,200.00", status: "active" },
    { id: 8, company: "Finance Plus", contact: "Sarah Davis", industry: "Finance", booths: 1, totalSpent: "$6,000.00", status: "active" },
  ];

  const tabs = [
    { id: "all-users", label: "All Users", count: allUsers.length },
    { id: "admins", label: "Admins", count: allUsers.filter(u => u.role === "Admin").length },
    { id: "customers", label: "Customers", count: customers.length },
    { id: "sponsors", label: "Sponsors", count: sponsors.length },
    { id: "promoters", label: "Promoters", count: promoters.length },
  ];

  const getInitial = (name) => name.charAt(0).toUpperCase();

  const getTableData = () => {
    switch (activeTab) {
      case "all-users":
        return allUsers;
      case "admins":
        return allUsers.filter(u => u.role === "Admin");
      case "customers":
        return customers;
      case "promoters":
        return promoters;
      case "sponsors":
        return sponsors;
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

    // Determine type if not explicitly passed (e.g. from All Users tab)
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
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => (
                <tr key={user.id}>
                  <td data-label="User">
                    <div className="user-cell">
                      <span className="avatar">{getInitial(user.name)}</span>
                      <div>
                        <h5 className="user-name">{user.name}</h5>
                        <p className="smaller-body-text">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className="button-label role-badge">{user.role}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`button-label status-${user.status}`}>{user.status}</span>
                  </td>
                  <td data-label="Joined" className="small-body-text">{user.joined}</td>
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
                    <span className={`button-label status-${customer.status}`}>{customer.status}</span>
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
                    <span className={`button-label status-${promoter.status}`}>{promoter.status}</span>
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
                    <span className={`button-label status-${sponsor.status}`}>{sponsor.status}</span>
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
