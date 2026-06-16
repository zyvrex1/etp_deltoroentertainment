import { getImageUrl } from '../utils/imageUrl';

const EventDetails = ({ event }) => {
    if (!event) return <p>Loading event details...</p>;

    return (
        <div className="event-details">
            <img 
                src={event.image ? getImageUrl(event.image) : '/assets/eventbg.jpg'} 
                alt={event.title} 
                style={{ width: '100%', borderRadius: '8px' }}
                onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
            />
            
            <h2>{event.title}</h2>
            <p className="category"><em>{event.category.toUpperCase()}</em></p>
            
            <p><strong>Description: </strong>{event.description}</p>

            <div className="venue-info">
                <h4>Location</h4>
                <p>{event.venue.name}</p>
                <p>{event.venue.address}, {event.venue.city} {event.venue.zipCode}</p>
            </div>

            <hr />

            <div className="event-meta">
                <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
                <p><strong>Price:</strong> ${event.ticketPrice}</p>
                <p><strong>Tickets Left:</strong> {event.totalTickets - event.ticketsSold}</p>
            </div>

            {event.isFeatured && <span className="badge">Featured Event!</span>}
        </div>
    )
}

export default EventDetails;