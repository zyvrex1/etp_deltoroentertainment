import "./Dashboard.css";
import { Icon } from "@iconify/react";

export default function Dashboard() {
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>System overview and key metrics.</p>
                </div>
                <div className="dashboard-actions">
                    <button className="outlined-button">View Report</button>
                    <button className="primary-button">+ Create Event</button>
                </div>
            </div>

            <div className="stats-grid">
                {/* Card 1 */}
                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon green">
                            <Icon icon="mdi:currency-usd" width="32" />
                        </span>
                        <span className="trend up">↑ 12.5%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Revenue</p>
                        <h3>$687,550.00</h3>
                        <p className="smaller-body-text">vs last month</p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon blue">
                            <Icon icon="mdi:calendar-check" width="32" />
                        </span>
                        <span className="trend up">↑ 8.2%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Active Events</p>
                        <h3>5</h3>
                        <p className="smaller-body-text">vs last month</p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon purple">
                            <Icon icon="mdi:account-group" width="32" />
                        </span>
                        <span className="trend up">↑ 5.4%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Users</p>
                        <h3>34</h3>
                        <p className="smaller-body-text">vs last month</p>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon red">
                            <Icon icon="mdi:alert-circle" width="32" />
                        </span>
                        {/* No trend for pending actions in design */}
                        <span className="trend down">!</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Pending Actions</p>
                        <h3>6</h3>
                        <p className="smaller-body-text">Requires attention</p>
                    </div>
                </div>
            </div>


            <div className="stats-grid small">
                <div className="stat-mini">
                    <div className="left-stats">
                        <p className="small-body-text">Tickets Sold Today</p>
                        <h4>1,245</h4>
                    </div>
                    <div className="right icon">
                        <span className="icon green">
                            <Icon icon="solar:ticket-outline" width="32" />
                        </span>
                    </div>
                </div>

                <div className="stat-mini">
                    <div className="left-stats">
                        <p className="small-body-text">Booths Booked</p>
                        <h4>85</h4>
                    </div>
                    <div className="right icon">
                        <span className="icon blue">
                            <Icon icon="mdi:storefront" width="32" />
                        </span>
                    </div>
                </div>

                <div className="stat-mini">
                    <div className="left-stats">
                        <p className="small-body-text">New Signups</p>
                        <h4>42</h4>
                    </div>
                    <div className="right icon">
                        <span className="icon purple">
                            <Icon icon="mdi:account-plus" width="32" />
                        </span>
                    </div>
                </div>

                <div className="stat-mini">
                    <div className="left-stats">
                        <p className="small-body-text">Open Support Tickets</p>
                        <h4>5</h4>
                    </div>
                    <div className="right icon">
                        <span className="icon red">
                            <Icon icon="mdi:lifebuoy" width="32" />
                        </span>
                    </div>
                </div>
            </div>

            <div className="main-grid">
                <div className="transactions-card">
                    <div className="card-header">
                        <h3>Recent Transactions</h3>
                        <a href="#">View All</a>
                    </div>

                    <ul className="transactions">
                        <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>John Smith</h5>
                                    <p className="small-body-text">john@techstart.com - 2026-02-10</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>

                        <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Techstart Summit 2026</h5>
                                    <p className="small-body-text">Emily Blunt - 2026-02-10</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$5,000.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>

                        <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Alice Nguyen</h5>
                                    <p className="small-body-text">alice@attendee.com - 2026-02-11</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label pending">pending</em>
                            </div>
                        </li>

                        <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Maria Lopez</h5>
                                    <p className="small-body-text">maria@vendor.com - 2026-02-08</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>

                         <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Maria Lopez</h5>
                                    <p className="small-body-text">maria@vendor.com - 2026-02-08</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>

                         <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Maria Lopez</h5>
                                    <p className="small-body-text">maria@vendor.com - 2026-02-08</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>

                         <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Maria Lopez</h5>
                                    <p className="small-body-text">maria@vendor.com - 2026-02-08</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>
                         <li className="transaction-item">
                            <div className="trans-left">
                                <span className="user-icon">
                                    <Icon icon="mdi:account-circle" width="48" />
                                </span>
                                <div className="user-info">
                                    <h5>Maria Lopez</h5>
                                    <p className="small-body-text">maria@vendor.com - 2026-02-08</p>
                                </div>
                            </div>

                            <div className="trans-right">
                                <h4 className="price">$299.00</h4>
                                <em className="button-label completed">completed</em>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="right-panel">
                    <div className="alert-card">
                            <div className="alert-inner">
                                <span className="alert-icon">
                                    <Icon icon="mdi:alert-circle" width="36" />
                                </span>

                                <div className="alert-content">
                                    <h4>Action Required</h4>
                                    <p>4 promoter payouts are pending approval.</p>
                                    <button className="outlined-button red">Review Payouts</button>
                                </div>
                            </div>
                        </div>

                    <div className="quick-actions-card">
                        <h4>Quick Actions</h4>
                        <button className="outlined-button quick-btn">
                            <h6>Approve New Events</h6>
                            <Icon icon="mdi:arrow-right" width="18" />
                        </button>
                        <button className="outlined-button quick-btn">
                            <h6>Manage Users</h6>
                            <Icon icon="mdi:arrow-right" width="18" />
                        </button>
                        <button className="outlined-button quick-btn">
                            <h6>System Settings</h6>
                            <Icon icon="mdi:arrow-right" width="18" />
                        </button>
                    </div>

                    <div className="promoters-card">
                        <div className="card-header">
                            <h4>Top Promoters</h4>
                        </div>

                        <ul className="promoters">
                            <li className="promoter-item">
                                <div className="promoter-left">
                                    <span className="promoter-icon">
                                        <Icon icon="mdi:account-circle" width="40" />
                                    </span>
                                    <div className="promoter-info">
                                        <h5 className="promoter-name">TechStart Inc</h5>
                                        <p className="small-body-text">contact@techstart.com</p>
                                    </div>
                                </div>

                                <div className="promoter-right">
                                    <span className="button-label top-rated">Top Rated</span>
                                </div>
                            </li>

                            <li className="promoter-item">
                                <div className="promoter-left">
                                    <span className="promoter-icon">
                                        <Icon icon="mdi:account-circle" width="40" />
                                    </span>
                                    <div className="promoter-info">
                                        <h5 className="promoter-name">MusicFest LLC</h5>
                                        <p className="small-body-text">info@musicfest.com</p>
                                    </div>
                                </div>

                                <div className="promoter-right">
                                    <span className="button-label top-rated">Top Rated</span>
                                </div>
                            </li>

                            <li className="promoter-item">
                                <div className="promoter-left">
                                    <span className="promoter-icon">
                                        <Icon icon="mdi:account-circle" width="40" />
                                    </span>
                                    <div className="promoter-info">
                                        <h5 className="promoter-name">EventPro Solutions</h5>
                                        <p className="small-body-text">hello@eventpro.com</p>
                                    </div>
                                </div>

                                <div className="promoter-right">
                                    <span className="button-label top-rated">Top Rated</span>
                                </div>
                            </li>

                              <li className="promoter-item">
                                <div className="promoter-left">
                                    <span className="promoter-icon">
                                        <Icon icon="mdi:account-circle" width="40" />
                                    </span>
                                    <div className="promoter-info">
                                        <h5 className="promoter-name">EventPro Solutions</h5>
                                        <p className="small-body-text">hello@eventpro.com</p>
                                    </div>
                                </div>

                                <div className="promoter-right">
                                    <span className="button-label top-rated">Top Rated</span>
                                </div>
                            </li>
                            
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
