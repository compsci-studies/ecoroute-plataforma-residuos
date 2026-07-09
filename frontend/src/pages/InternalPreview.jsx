import { Navigate, useParams } from "react-router-dom";

import DriverDashboard from "../components/Driver/DriverDashboard";
import CustomerDashboard from "../components/users/CustomerDashboard";
import UploadWastePage from "../components/users/UploadWastePage";

const PREVIEW_COMPONENTS = {
  "customer-dashboard": {
    role: "customer_admin",
    Component: CustomerDashboard,
  },
  "upload-waste": {
    role: "customer_admin",
    Component: UploadWastePage,
  },
  "driver-dashboard": {
    role: "driver",
    Component: DriverDashboard,
  },
};

function buildPreviewUser(role) {
  return {
    _id: `preview-${role}`,
    id: `preview-${role}`,
    name: role === "driver" ? "Coletor EcoRoute" : "Cliente EcoRoute",
    email: `${role}@ecoroute.local`,
    role,
    orgId: "preview-org",
    organization: {
      _id: "preview-org",
      name: "EcoRoute São Paulo",
    },
  };
}

export default function InternalPreview() {
  const { screen } = useParams();
  const config = PREVIEW_COMPONENTS[screen];

  if (!import.meta.env.DEV || !config) {
    return <Navigate to="/" replace />;
  }

  const user = buildPreviewUser(config.role);
  const PreviewComponent = config.Component;
  return <PreviewComponent previewMode previewUser={user} />;
}
