import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import RoomImage from '../ui/RoomImage.jsx';
import { ROOM_TYPES } from '../../utils/constants.js';
import { money, imageUrl } from '../../utils/format.js';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function RoomCard({ room, query = '' }) {
  const { settings } = useSettings();
  const type = ROOM_TYPES[room.type];
  return (
    <article className="room-card">
      <Link to={`/rooms/${room._id}${query}`} className="room-card-media" tabIndex={-1} aria-hidden="true">
        <RoomImage src={imageUrl(room.images?.[0])} alt={`${type?.label} ${room.roomNumber}`} />
        <span className="room-plaque">{room.roomNumber}</span>
      </Link>
      <div className="room-card-body">
        <h3>
          <Link to={`/rooms/${room._id}${query}`}>{type?.label}</Link>
        </h3>
        <ul className="room-specs">
          <li><Icon name="users" size={16} /> Up to {room.maxGuests}</li>
          <li><Icon name="bed" size={16} /> {room.bedType} bed</li>
          <li><Icon name="expand" size={16} /> {room.size} m²</li>
        </ul>
        <p className="room-card-view">{room.view} view, floor {room.floor}</p>
        <div className="room-card-foot">
          <p className="price">
            {money(room.pricePerNight, settings.currency)} <span>per night</span>
          </p>
          <Link to={`/rooms/${room._id}${query}`} className="btn btn-outline btn-sm">View room</Link>
        </div>
      </div>
    </article>
  );
}
