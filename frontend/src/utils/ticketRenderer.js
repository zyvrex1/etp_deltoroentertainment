import Konva from 'konva';
import { getImageUrl } from './imageUrl';
import brandLogo from "../assets/Logo1.png";
import jsPDF from "jspdf";

// Inline date/time formatters
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const formatDate = (dateStr) => {
    if (!dateStr) return { dayName: '', day: '', monthYear: '' };
    const d = new Date(dateStr);
    return {
        dayName: DAYS[d.getUTCDay()],
        day: String(d.getUTCDate()),
        monthYear: `${MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`
    };
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2,'0')} ${period}`;
};

const TICKET_WIDTH = 2047;
const TICKET_HEIGHT = 1000;

export const generateTicketsForReservations = async (reservationsToProcess) => {
    const generatedTickets = [];

    // Create a hidden container for Konva
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    // Preload brand logo
    const brandImg = await loadImage(brandLogo);

    for (const res of reservationsToProcess) {
        let layoutItems = [];

        let categoryId = res.priceLevelId ? String(res.priceLevelId) : null;

        if (res.event && res.event.ticketLayouts && res.event.ticketLayouts.length > 0) {
            // Try to match to the specific price level layout, fallback to first
            const layoutObj = (
                categoryId
                    ? res.event.ticketLayouts.find(l => String(l.priceLevelId?._id || l.priceLevelId) === categoryId)
                    : null
            ) || res.event.ticketLayouts[0];
            if (layoutObj && layoutObj.layout) {
                layoutItems = layoutObj.layout;
            }
        }

        if (layoutItems.length === 0) {
            console.warn("No ticket layout found for event, using fallback layout:", res.event?.title);
            layoutItems = createDefaultTemplate(res.event);
        }

        const stage = new Konva.Stage({
            container: container,
            width: TICKET_WIDTH,
            height: TICKET_HEIGHT,
        });

        const layer = new Konva.Layer();
        stage.add(layer);

        // Preload all images used in this layout
        const imageCache = {};
        for (const item of layoutItems) {
            if (item.type === 'image' && item.url && item.dynamicField !== 'qrData') {
                if (!imageCache[item.url]) {
                    let urlToLoad = item.url;
                    if (urlToLoad.startsWith('/api/') || urlToLoad.startsWith('uploads/')) {
                         urlToLoad = getImageUrl(urlToLoad);
                    }
                    imageCache[item.url] = await loadImage(urlToLoad);
                }
            }
        }

        // Setup dynamic variables
        const eventDate = formatDate(res.event?.startDate);
        const eventTime = formatTime(res.event?.startTime);
        const venueStr = `${res.event?.venue?.name || 'Venue'} - ${res.event?.venue?.address || 'Address'}`;
        const eventImgUrl = res.event?.image ? getImageUrl(res.event.image) : "/assets/eventbg.jpg";

        let priceName = 'Ticket';
        let priceFace = 'FREE';
        let typePrefix = 'Ticket';

        // Find price level info using categoryId from the reservation
        if (categoryId && res.event?.priceLevels) {
            const pl = res.event.priceLevels.find(p => String(p._id) === categoryId);
            if (pl) {
                priceName = pl.priceName || 'Category';
                priceFace = pl.facePrice > 0 ? `$${pl.facePrice}` : 'FREE';
                typePrefix = pl.type?.startsWith('Seat') ? 'Seat' : (pl.type?.startsWith('Booth') ? 'Booth' : 'Ticket');
            }
        }

        // Override for special reservation types
        if (res.type === 'sponsorship') {
            priceName = priceName === 'Ticket' ? 'Sponsorship' : priceName;
            if (priceFace === 'FREE' && res.amount?.total) priceFace = `$${res.amount.total}`;
            if (typePrefix === 'Ticket') typePrefix = 'Sponsor';
        } else if (res.type === 'booth' && priceName === 'Ticket') {
            priceName = 'Booth';
            if (priceFace === 'FREE' && res.amount?.total) priceFace = `$${res.amount.total}`;
            typePrefix = 'Booth';
        } else if (priceFace === 'FREE' && res.amount?.total) {
            // Last resort: use amount from reservation if price level didn't resolve
            priceFace = `$${res.amount.total}`;
        }

        // Get seats info
        let ticketsToGenerate = [];
        if (res.type === 'seat' && res.seatLabels && res.seatLabels.length > 0) {
            res.seatLabels.forEach((label) => {
                ticketsToGenerate.push({
                    uniqueId: res._id.toString(),
                    seatLabel: label
                });
            });
        } else {
            ticketsToGenerate.push({
                uniqueId: res._id.toString(),
                seatLabel: res.boothCode || (res.type === 'sponsorship' ? 'Sponsor' : 'GEN AD')
            });
        }
        
        for (const ticketInfo of ticketsToGenerate) {
            const qrUrl = `https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${ticketInfo.uniqueId}&scale=5`;
            const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${ticketInfo.uniqueId}&includetext=false&rotate=R&scale=3`;
            
            const qrImg = await loadImage(qrUrl);
            const barcodeImg = await loadImage(barcodeUrl);

            layer.destroyChildren();

            for (const item of layoutItems) {
                const nodeProps = { ...item };
                
                if (item.type === 'rect') {
                    const rect = new Konva.Rect(nodeProps);
                    layer.add(rect);
                } else if (item.type === 'text') {
                    // Dynamic text replacement
                    if (item.id === 'event-title') nodeProps.text = res.event?.title || item.text;
                    if (item.id === 'date-label') nodeProps.text = eventDate.dayName;
                    if (item.id === 'day-text') nodeProps.text = eventDate.day;
                    if (item.id === 'month-year') nodeProps.text = eventDate.monthYear;
                    if (item.id === 'time-text') nodeProps.text = eventTime;
                    if (item.id === 'venue-name') nodeProps.text = venueStr;
                    if (item.id === 'category-name') nodeProps.text = priceName;
                    if (item.id === 'category-sub') nodeProps.text = typePrefix;
                    if (item.id === 'price-text') nodeProps.text = priceFace;
                    if (item.id === 'seat-label') nodeProps.text = ticketInfo.seatLabel;

                    const textNode = new Konva.Text(nodeProps);
                    layer.add(textNode);
                } else if (item.type === 'image') {
                    let imgObj = imageCache[item.url];
                    
                    if (item.id === 'brand-text' || item.id === 'brand-logo') imgObj = brandImg;
                    if (item.id === 'event-img') {
                        if (!imageCache[eventImgUrl]) {
                            imageCache[eventImgUrl] = await loadImage(eventImgUrl);
                        }
                        imgObj = imageCache[eventImgUrl] || imgObj;
                    }
                    
                    if (item.id === 'qr-code' || item.id === 'qr-placeholder') {
                        imgObj = qrImg;
                    }
                    if (item.id === 'barcode-img') {
                        imgObj = barcodeImg;
                    }

                    if (imgObj) {
                        const imgNode = new Konva.Image({
                            ...nodeProps,
                            image: imgObj
                        });
                        layer.add(imgNode);
                    }
                }
            }

            layer.draw();

            // Render to jpeg
            const dataUrl = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 });
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [TICKET_WIDTH, TICKET_HEIGHT]
            });
            pdf.addImage(dataUrl, 'JPEG', 0, 0, TICKET_WIDTH, TICKET_HEIGHT);
            const pdfDataUrl = pdf.output('datauristring');

            generatedTickets.push({
                base64Data: pdfDataUrl,
                filename: `ticket-${ticketInfo.uniqueId}.pdf`
            });
        }

        stage.destroy();
    }

    document.body.removeChild(container);
    return generatedTickets;
};

const createDefaultTemplate = (event) => {
    return [
      { id: 'bg-border', type: 'rect', x: 0, y: 0, width: TICKET_WIDTH, height: TICKET_HEIGHT, fill: '#D32F2F', cornerRadius: 40 },
      { id: 'bg-main', type: 'rect', x: 20, y: 20, width: TICKET_WIDTH - 40, height: TICKET_HEIGHT - 40, fill: '#FFFFFF', cornerRadius: 30 },
      { id: 'left-stripe', type: 'rect', x: 20, y: 20, width: 220, height: TICKET_HEIGHT - 40, fill: '#D32F2F', cornerRadius: { tl: 30, bl: 30 } },
      { id: 'brand-text', type: 'image', x: 30, y: 750, width: 500, height: 200, url: brandLogo, rotation: -90 },
      { id: 'qr-code', type: 'image', x: 300, y: 60, width: 350, height: 350, dynamicField: 'qrData' },
      { id: 'event-img', type: 'image', x: 300, y: 430, width: 350, height: 350, url: "/assets/eventbg.jpg" },
      { id: 'event-title', type: 'text', x: 800, y: 100, text: 'Event Title', fontSize: 70, fontStyle: 'bold', width: 1000 },
      { id: 'date-label', type: 'text', x: 700, y: 220, text: 'Date', fontSize: 50 },
      { id: 'day-text', type: 'text', x: 700, y: 280, text: '00', fontSize: 100, fontStyle: 'bold' },
      { id: 'month-year', type: 'text', x: 700, y: 400, text: 'Month, Year', fontSize: 50 },
      { id: 'time-text', type: 'text', x: 700, y: 460, text: 'Time', fontSize: 50 },
      { id: 'divider-1', type: 'rect', x: 950, y: 220, width: 2, height: 300, fill: '#000' },
      { id: 'category-name', type: 'text', x: 1000, y: 220, text: 'Ticket', fontSize: 70, fontStyle: 'bold' },
      { id: 'category-sub', type: 'text', x: 1000, y: 330, text: 'Booth', fontSize: 50, color: '#666' },
      { id: 'seat-label', type: 'text', x: 1000, y: 400, text: '1', fontSize: 60, fontStyle: 'bold' },
      { id: 'price-text', type: 'text', x: 1000, y: 470, text: '$0', fontSize: 60, fontStyle: 'bold' },
      { id: 'venue-name', type: 'text', x: 400, y: 800, width: 1400, text: 'Venue - Address', fontSize: 50, align: 'center', fontStyle: 'bold' },
      { id: 'disclaimer', type: 'text', x: 400, y: 870, width: 1400, text: 'Print this e-Ticket in color or black/white or show it on your phone. You will not get admitted without this ticket.', fontSize: 30, align: 'center' },
      { id: 'barcode-img', type: 'image', x: 1880, y: 150, width: 100, height: 700, dynamicField: 'qrData' }
    ];
};

const loadImage = (url) => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error("Failed to load image for ticket:", url);
            resolve(null);
        };
        img.src = url;
    });
};
