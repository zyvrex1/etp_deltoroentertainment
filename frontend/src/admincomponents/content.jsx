import React, { useState, useEffect } from "react";
import {
  FaFileContract,
  FaShieldAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { Icon } from "@iconify/react";
import "./content.css";
import CreateAnnouncementModal from "./Modal/CreateAnnouncementModal";
import EditAnnouncementModal from "./Modal/EditAnnouncementModal";
import CreatePolicyModal from "./modal/CreatePolicyModal";
import EditPolicyModal from "./modal/EditPolicyModal";
import { showDeleteConfirmAlert, showSuccessAlert } from "./utils/sweetAlert";

const ContentManager = () => {
  // --- Announcement states ---
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // --- Policy states ---
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false);

  // --- Fetch Announcements ---
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      const data = await res.json();
      setAnnouncements(data.map((a) => ({ id: a._id, ...a })));
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  // --- Fetch Policies ---
  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/policies");
      if (!res.ok) throw new Error("Failed to fetch policies");
      const data = await res.json();
      const icons = {
        tos: <FaFileContract />,
        privacy: <FaShieldAlt />,
        refund: <FaFileInvoiceDollar />,
      };
      setPolicies(
        data.map((p) => ({ id: p.policyKey, ...p, icon: icons[p.policyKey] })),
      );
    } catch (err) {
      console.error("Error fetching policies:", err);
    }
  };

  // --- Run once on mount ---
  useEffect(() => {
    fetchAnnouncements();
    fetchPolicies();
  }, []);

  // Announcement Handler
  const handleSaveAnnouncement = async (formData) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      await res.json();
      await fetchAnnouncements(); // <-- refresh announcements
    } catch (err) {
      console.error("Error creating announcement:", err);
    }
  };

  const handleUpdateAnnouncement = async (updatedAnnouncement) => {
    try {
      const res = await fetch(`/api/announcements/${updatedAnnouncement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAnnouncement),
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      await res.json();
      await fetchAnnouncements(); // <-- refresh announcements
      setEditingAnnouncement(null);
    } catch (err) {
      console.error("Error updating announcement:", err);
    }
  };

  const handleDeleteAnnouncement = async (announcement) => {
    const result = await showDeleteConfirmAlert(
      "Delete Announcement",
      `Are you sure you want to delete "${announcement.title}"?`,
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/announcements/${announcement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      await res.json();
      await fetchAnnouncements(); // <-- refresh announcements
      await showSuccessAlert("Deleted!", "Announcement deleted successfully.");
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  // --- Policy Handlers ---
  const handleAddPolicy = async (newPolicy) => {
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPolicy),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      const createdPolicy = await res.json();

      const icons = {
        tos: <FaFileContract />,
        privacy: <FaShieldAlt />,
        refund: <FaFileInvoiceDollar />,
      };
      setPolicies((prev) => [
        ...prev,
        {
          id: createdPolicy.policyKey,
          ...createdPolicy,
          icon: icons[createdPolicy.policyKey],
        },
      ]);

      setIsAddPolicyOpen(false);
    } catch (err) {
      console.error("Error adding policy:", err);
    }
  };

  const handleUpdatePolicy = async (updatedPolicy) => {
    try {
      const res = await fetch(`/api/policies/${updatedPolicy.policyKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPolicy),
      });
      if (!res.ok) throw new Error("Failed to update policy");
      await res.json();
      await fetchPolicies(); // <-- refresh policies
      setEditingPolicy(null);
    } catch (err) {
      console.error("Error updating policy:", err);
    }
  };

  const handleDeletePolicy = async (policy) => {
    const result = await showDeleteConfirmAlert(
      "Delete Policy",
      `Are you sure you want to delete "${policy.title}"? This action cannot be undone.`,
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/policies/${policy.policyKey}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete policy");
      await res.json();
      await fetchPolicies(); // <-- refresh policies
      await showSuccessAlert("Deleted!", "Policy deleted successfully.");
    } catch (err) {
      console.error("Error deleting policy:", err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="content-manager">
      <div className="content-header">
        <div>
          <h1>Content Management</h1>
          <p>Manage platform announcements and static content</p>
        </div>
        <div className="content-actions"></div>
        <div className="content-actions"></div>
      </div>

      <div className="content-grid">
        <div className="content-card announcements-card">
          <div className="card-header-with-action">
            <h3>Announcements</h3>
            <button
              className="add-icon-btn"
              onClick={() => setIsAnnouncementModalOpen(true)}
              aria-label="New Announcement"
            >
              <Icon icon="mdi:plus" />
            </button>
          </div>
          <div className="announcement-list">
            {announcements.map((a, index) => (
              <div key={`${a.id}-${index}`} className="announcement-item">
                <div className="announcement-header">
                  <h5>{a.title}</h5>
                  <div className="announcement-header-right">
                    <span className="small-body-text announcement-date">
                      {formatDate(a.date)}
                    </span>
                    <div className="announcement-actions">
                      <button
                        className="announcement-action-btn"
                        onClick={() => setEditingAnnouncement(a)}
                      >
                        <Icon icon="mdi:edit" width="18" />
                      </button>
                      <button
                        className="announcement-action-btn delete"
                        onClick={() => handleDeleteAnnouncement(a)}
                      >
                        <Icon icon="mdi:delete" width="18" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="small-body-text announcement-desc">{a.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card legal-card">
          <div className="card-header-with-action">
            <h3>Legal & Policies</h3>
            <button
              className="add-icon-btn"
              onClick={() => setIsAddPolicyOpen(true)}
              aria-label="New Policy"
            >
              <Icon icon="mdi:plus" />
            </button>
          </div>
          <div className="legal-list">
            {policies.map((p, index) => (
              <div
                key={`${p.policyKey}-${index}`}
                className="legal-item-container"
              >
                <div className="legal-header">
                  <h5>{p.title}</h5>
                  <div className="legal-header-right">
                    <span className="small-body-text announcement-date">
                      {formatDate(p.date)}
                    </span>
                    <div className="legal-actions">
                      <button
                        className="legal-action-btn"
                        onClick={() => setEditingPolicy(p)}
                      >
                        <Icon icon="mdi:edit" width="18" />
                      </button>
                      <button
                        className="legal-action-btn delete"
                        onClick={() => handleDeletePolicy(p)}
                      >
                        <Icon icon="mdi:delete" width="18" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="small-body-text legal-desc">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        onSave={handleSaveAnnouncement}
      />
      <EditAnnouncementModal
        isOpen={!!editingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        onSave={handleUpdateAnnouncement}
        announcement={editingAnnouncement}
      />
      <EditPolicyModal
        isOpen={!!editingPolicy}
        policy={editingPolicy}
        onClose={() => setEditingPolicy(null)}
        onSave={handleUpdatePolicy}
        // Pass existing keys excluding the one being edited
        usedKeys={policies
          .filter((p) => p.policyKey !== editingPolicy?.policyKey)
          .map((p) => p.policyKey)}
      />
      <CreatePolicyModal
        isOpen={isAddPolicyOpen}
        onClose={() => setIsAddPolicyOpen(false)}
        onSave={handleAddPolicy}
        // Pass existing keys to the modal to prevent duplicates
        usedKeys={policies.map((p) => p.policyKey)}
      />
    </div>
  );
};

export default ContentManager;
