import { useState } from 'react';
import { initials } from '../../utils/format.js';

export default function Avatar({ user, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.34) };
  if (user?.avatar?.url && !failed) {
    return <img className="avatar avatar-img" src={user.avatar.url} alt="" style={style} onError={() => setFailed(true)} />;
  }
  return <span className="avatar" style={style}>{initials(user?.name)}</span>;
}
