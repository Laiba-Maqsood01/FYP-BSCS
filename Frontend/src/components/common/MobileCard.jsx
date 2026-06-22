import { Card } from "react-bootstrap";
import "./MobileCard.css"

export default function MobileCard({ title, fields = [], actions }) {
  return (
    <Card className="mobile-card mb-3 shadow-sm">
      <Card.Body>

        {/* TITLE */}
        {title && (
          <Card.Title className="mb-3 fw-semibold">
            {title}
          </Card.Title>
        )}

        {/* FIELDS */}
        <div className="mobile-card-fields">
          {fields.map((field, index) => (
            <div key={index} className="mobile-card-row">
              <span className="label">{field.label}</span>
              <span className="value">{field.value}</span>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        {actions && (
          <div className="mobile-card-actions mt-3 d-flex gap-2 flex-wrap">
            {actions}
          </div>
        )}

      </Card.Body>
    </Card>
  );
}