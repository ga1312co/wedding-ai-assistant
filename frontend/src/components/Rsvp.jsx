import React from 'react';
import './Rsvp.css';

const Rsvp = ({ onClose }) => {
  return (
    <div className="rsvp-modal">
      <div className="rsvp-modal-content">
        <div className="rsvp-modal-header">
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSdw7kRBP2pUa6Ka2b9HEZA-tRatiDqRDzB13EF_wHy7LE8n7A/viewform?embedded=true" width="100%" height="500" frameBorder="0" marginHeight="0" marginWidth="0">Loading…</iframe>
      </div>
    </div>
  );
};

export default Rsvp;
