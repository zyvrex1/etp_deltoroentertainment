import React from "react";
import { Icon } from "@iconify/react";
import "./SponsorViewOrder.css";

const SponsorViewOrder = ({ isOpen, onClose, order, onStatusChange, onPaymentChange }) => {
  if (!isOpen || !order) return null;

  const isUnpaid = order.payment === "Unpaid";
  const items = order.fullItems || [];

  return (
    <div className="svo-modal-overlay" onClick={onClose}>
      <div className="svo-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="svo-modal-header">
          <div>
            <h2>Order {order.id}</h2>
            <p className="svo-time">{order.time}</p>
          </div>
          <button className="svo-close-btn" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>
        
        <div className="svo-modal-body">
          <div className="svo-info-grid">
            <div className="svo-info-col">
              <span className="svo-info-label">CUSTOMER</span>
              <span className="svo-info-value">{order.customer}</span>
            </div>
            <div className="svo-info-col">
              <span className="svo-info-label">PAYMENT</span>
              <span className={`svo-badge ${order.payment === 'Paid' ? 'paid' : 'unpaid'}`}>
                <Icon icon={order.payment === 'Paid' ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                {order.payment}
              </span>
            </div>
            <div className="svo-info-col">
              <span className="svo-info-label">STATUS</span>
              <span className={`svo-badge status ${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                <Icon icon="mdi:clock-outline" /> {order.status}
              </span>
            </div>
          </div>

          {isUnpaid && (
            <div className="svo-payment-alert">
              <div className="svo-alert-header">
                <Icon icon="mdi:alert-circle-outline" className="svo-alert-icon" />
                <strong>Payment not yet collected</strong>
              </div>
              <p>Collect payment from the customer on-site, then mark as paid:</p>
              <div className="svo-alert-buttons">
                <button 
                  className="svo-btn-cash"
                  onClick={() => onPaymentChange(order.id, "Paid")}
                >
                  <Icon icon="mdi:cash" /> Paid with Cash
                </button>
                <button 
                  className="svo-btn-card"
                  onClick={() => onPaymentChange(order.id, "Paid")}
                >
                  <Icon icon="mdi:credit-card-outline" /> Paid with Card
                </button>
              </div>
            </div>
          )}

          <div className="svo-items-section">
            <h4 className="svo-section-title">Order Items</h4>
            <div className="svo-items-list">
              {items.map((item, idx) => (
                <div className="svo-item-row" key={idx}>
                  <div className="svo-item-left">
                    <span className="svo-item-qty">{item.quantity}x</span>
                    <span className="svo-item-name">{item.name}</span>
                  </div>
                  <span className="svo-item-price">${(item.price * item.quantity).toFixed(2)}</span> 
                </div>
              ))}
            </div>
            
            <div className="svo-totals">
              <div className="svo-total-row">
                <span>Subtotal</span>
                <span>{order.total}</span>
              </div>
              <div className="svo-total-row">
                <span>Tax (included)</span>
                <span>$0.00</span>
              </div>
              <div className="svo-total-row grand-total">
                <span>Total</span>
                <span>{order.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="svo-modal-footer">
          <div className="svo-status-dropdown-wrapper">
             <select 
               className="svo-status-select"
               value={order.status}
               onChange={(e) => onStatusChange(order.id, e.target.value)}
             >
                <option value="Pending">Move to Pending</option>
                <option value="Preparing">Move to Preparing</option>
                <option value="Ready for Pickup">Move to Ready for Pickup</option>
                <option value="Completed">Move to Completed</option>
             </select>
          </div>
          <button className="svo-close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorViewOrder;
