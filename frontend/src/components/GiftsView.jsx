import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import { io } from "socket.io-client";
import { useAuthContext } from "../hooks/useAuthContext";
import digitalgiftsService from "../services/digitalgiftsService";
import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import "./GiftsView.css";

const ITEMS_PER_PAGE = 8;

export default function GiftsView({ role = "customer" }) {
  const { user } = useAuthContext();
  const [myGifts, setMyGifts] = useState([]);
  const [claimCode, setClaimCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMyGifts = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const data = await digitalgiftsService.getMyGifts(user.token);
      setMyGifts(data);
    } catch (error) {
      console.error("Error fetching my gifts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchMyGifts();
  }, [fetchMyGifts]);

  const totalPages = Math.max(1, Math.ceil(myGifts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedGifts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return myGifts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [myGifts, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

const socketRef = useRef(null);   // ← add this near other state declarations

useEffect(() => {
    if (!user?.token) {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        return;
    }

    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
        withCredentials: true,
        transports: ["polling", "websocket"],
        upgrade: false,
    });

    socketRef.current = socket;

    socket.on("newNotification", (notification) => {
        const title = (notification?.title || "").toLowerCase();
        if (
            title.includes("gift restored") ||
            title.includes("gift returned") ||
            title.includes("payment rejected")
        ) {
            fetchMyGifts();
        }
    });

    return () => {
        socket.disconnect();
        socketRef.current = null;
    };
}, [user?.token, fetchMyGifts]);


  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimCode.trim()) return;

    setClaiming(true);
    try {
      await digitalgiftsService.redeemByCode(claimCode.trim(), user.token);
      await showSuccessAlert("Success!", `Gift code "${claimCode.toUpperCase()}" successfully claimed!`);
      setClaimCode("");
      setCurrentPage(1);
      fetchMyGifts();
    } catch (error) {
      await showErrorAlert("Claim Failed", error.message || "Invalid, expired, or fully redeemed gift code.");
    } finally {
      setClaiming(false);
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case "gift_card":
        return "mdi:card-giftcard";
      case "discount":
        return "mdi:tag-outline";
      case "promo":
        return "mdi:ticket-confirmation-outline";
      default:
        return "mdi:gift-outline";
    }
  };

  const formatValue = (g) => {
    if (g.valueType === "percent") return `${g.value}% Off`;
    if (g.valueType === "fixed") return `$${g.value?.toLocaleString()}`;
    return "Buy 2 Get 1 Free";
  };

  const renderGiftCard = (gift) => {
    const isRedeemed = gift.assignmentStatus === "redeemed";
    const isExpired = gift.status === "expired" || (gift.expiresAt && new Date(gift.expiresAt) < new Date());
    const badgeClass = isRedeemed
      ? "badge-redeemed"
      : isExpired
      ? "badge-expired"
      : "badge-active";

    return (
      <div
        key={gift.giftId}
        className={`my-gift-card ${isRedeemed ? "redeemed" : ""} ${isExpired ? "expired" : ""}`}
      >
        <div className="card-top-row">
          <div className={`button-label gift-badge ${isRedeemed ? "redeemed" : ""} ${isExpired ? "expired" : ""}`}>
            <Icon icon={getCardIcon(gift.type)} />
            <span>
              {gift.type === "gift_card"
                ? "Gift Card"
                : gift.type === "discount"
                ? "Discount"
                : "Coupon"}
            </span>
          </div>
          <span className={`button-label status-badge ${badgeClass}`}>
            {isRedeemed ? "Redeemed" : isExpired ? "Expired" : "Active"}
          </span>
        </div>

        <div className="card-main-info">
          <h3 className="gift-name">{gift.name}</h3>
          <p className="gift-description smaller-body-text">
            {gift.description || "No description provided."}
          </p>
        </div>

        <div className="card-value-display">
          <h2 className="gift-value">{formatValue(gift)}</h2>
        </div>

        <div className="card-footer-row">
          <div className="gift-expiry-display">
            <Icon icon="mdi:calendar-clock" />
            <span>
              {gift.expiresAt
                ? `Exp: ${new Date(gift.expiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : "No Expiration"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeletonCards = () => (
    <div className="my-gifts-grid">
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <div key={index} className="my-gift-card gift-card-skeleton">
          <div className="card-top-row">
            <div className="skeleton-box gift-skeleton-badge" />
            <div className="skeleton-box gift-skeleton-status" />
          </div>
          <div className="card-main-info">
            <div className="skeleton-box gift-skeleton-title" />
            <div className="skeleton-box gift-skeleton-desc" />
            <div className="skeleton-box gift-skeleton-desc-short" />
          </div>
          <div className="card-value-display">
            <div className="skeleton-box gift-skeleton-value" />
          </div>
          <div className="card-footer-row">
            <div className="skeleton-box gift-skeleton-expiry" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="gifts-view-container">
      <div className="gifts-view-header">
        <div>
          <h2>My Gift Cards & Coupons</h2>
          <p className="large-body-text">
            View your active discounts and claim new promotional gift codes.
          </p>
        </div>
      </div>

      {/* Claim / Redeem Code Section */}
      <div className="claim-code-card">
        <form onSubmit={handleClaim} className="claim-code-form">
          <div className="claim-input-group">
            <Icon icon="mdi:ticket-percent" className="claim-icon" />
            <input
              type="text"
              placeholder="Enter promo or gift code (e.g. WLCM500)..."
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              disabled={claiming}
            />
          </div>
          <button type="submit" className="claim-btn" disabled={claiming || !claimCode.trim()}>
            {claiming ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Icon icon="mdi:plus-circle-outline" /> Claim Code
              </>
            )}
          </button>
        </form>
      </div>

      {/* Gifts & Discounts Grid */}
      {isLoading ? (
        renderSkeletonCards()
      ) : myGifts.length === 0 ? (
        <div className="gifts-empty-state">
          <Icon icon="mdi:gift-off-outline" className="empty-icon" />
          <h3>No Gift Cards Yet</h3>
          <p className="regular-body-text">
            You don't have any assigned gift cards or coupons. Claim a code above to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="my-gifts-grid">
            {paginatedGifts.map((gift) => renderGiftCard(gift))}
          </div>

          {totalPages > 1 && (
            <div className="gifts-pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info regular-body-text">
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
        </>
      )}
    </div>
  );
}
