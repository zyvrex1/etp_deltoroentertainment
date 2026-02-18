import { useState } from 'react';
import { Icon } from '@iconify/react';
import './CreateEventModal.css';

const CreateEventModal = ({ isOpen, onClose }) => {
    const today = new Date().toISOString().split("T")[0];

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('other');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [ticketPrice, setTicketPrice] = useState(0);
    const [totalTickets, setTotalTickets] = useState(0);
    
    // Nested state for Venue
    const [venue, setVenue] = useState({
        name: '',
        address: '',
        city: '',
        zipCode: ''
    });
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault();

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);

        const event = {
            title,
            description,
            category,
            venue: {
                name: venue.name,
                address: venue.address,
                city: venue.city,
                zipCode: venue.zipCode
            },
            startDate, // optional if your schema still uses it
            endDate,   // optional
            startTime: startDateTime,  // ✅ send Date object
            endTime: endDateTime,      // ✅ send Date object
            ticketPrice: Number(ticketPrice),
            totalTickets: Number(totalTickets)
        };


        const response = await fetch('/api/events', {
            method: 'POST',
            body: JSON.stringify(event),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const json = await response.json();

        if (endDate < startDate) {
        setError("End date cannot be earlier than start date.");
        return;
        }

        if (!response.ok) {
            setError(json.error);
        } else {
            // Reset form on success
            setTitle('');
            setDescription('');
            setVenue({ name: '', address: '', city: '', zipCode: '' });
            setStartTime('');
            setEndTime('');
            setStartDate('');
            setEndDate('');
            setTicketPrice(0);
            setTotalTickets(0);
            setError(null);
            onClose(); // Close modal on success
            console.log('New Event Added', json);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Create New Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <form className="modal-body create-event-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <h6>Event Title</h6>
                            <input 
                                type="text" 
                                required 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                placeholder="e.g. Tech Summit 2024" 
                            />
                        </div>
                        <div className="form-group">
                            <h6>Category</h6>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="concert">Concert</option>
                                <option value="comedy">Comedy</option>
                                <option value="festival">Festival</option>
                                <option value="conference">Conference</option>
                                <option value="sports">Sports</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <h6>Start Date</h6>
                            <input
                            type="date"
                            required
                            min={today}
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);

                                // If endDate is earlier than new startDate, auto-fix it
                                if (endDate < e.target.value) {
                                setEndDate(e.target.value);
                                }
                            }}
                            />
                        </div>
                        <div className="form-group">
                            <h6>End Date</h6>
                            <input
                            type="date"
                            required
                            min={startDate} // cannot select before start date
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <h6>Start Time</h6>
                            <input 
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <h6>End Time</h6>
                            <input 
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="section-box">
                        <h5 className="modal-section-title">Venue Details</h5>
                        <div className="form-group">
                            <input 
                                type="text" 
                                placeholder="Venue Name" 
                                required
                                value={venue.name}
                                onChange={(e) => setVenue({...venue, name: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="text"
                                placeholder="Street Address"
                                required
                                value={venue.address}
                                onChange={(e) => setVenue({...venue, address: e.target.value})}
                            />
                        </div>
                        <div className="form-row">
                            <input 
                                type="text" 
                                placeholder="City" 
                                value={venue.city}
                                onChange={(e) => setVenue({...venue, city: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="Zip Code" 
                                value={venue.zipCode}
                                onChange={(e) => setVenue({...venue, zipCode: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <h6>Ticket Price ($)</h6>
                            <input type="number" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
                        </div>
                        <div className="form-group">
                            <h6>Total Capacity</h6>
                            <input type="number" min="1" value={totalTickets} onChange={(e) => setTotalTickets(Number(e.target.value))} />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <h6>About The Event</h6>
                        <textarea 
                            required
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Event description..." 
                            rows="4"
                        ></textarea>
                    </div>

                    {error && <div className="error-message" style={{color: 'red', marginTop: '10px'}}>{error}</div>}
                    
                    <div className="modal-footer">
                        <button type="button" className="button cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-button create-btn">Create Event</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
