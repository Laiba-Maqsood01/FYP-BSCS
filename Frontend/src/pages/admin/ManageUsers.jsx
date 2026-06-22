import { useEffect, useState } from "react";
import { Table, Button, Badge, Spinner } from "react-bootstrap";
import api from "../../services/api";
import { showError, showSuccess } from "../../utils/toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import MobileCard from "../../components/common/MobileCard";


export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch (err) {
      showError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= DELETE USER =================
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/admin/users/${selectedUser._id}`);

      showSuccess("User deleted");

      setShowDeleteModal(false);
      setSelectedUser(null);

      fetchUsers();
    } catch (err) {
      showError("Delete failed");
    }
  };

  // ================= APPROVE / REJECT =================
  const approveInstructor = async (userId) => {
    try {
      await api.put(`/admin/approve-instructor/${userId}`);
      showSuccess("Instructor approved");
      fetchUsers();
    } catch (err) {
      showError("Failed to approve");
    }
  };

  const rejectInstructor = async (userId) => {
    try {
      await api.put(`/admin/reject-instructor/${userId}`);
      showSuccess("Instructor rejected");
      fetchUsers();
    } catch (err) {
      showError("Failed to reject");
    }
  };

  // ================= UI HELPERS =================
  const getRoleBadge = (role) => {
    const map = {
      admin: "danger",
      instructor: "primary",
      student: "success",
    };

    return <Badge bg={map[role] || "secondary"}>{role}</Badge>;
  };

  const getInstructorStatus = (user) => {
    if (user.instructorRequest === "pending")
      return <Badge bg="warning">Pending</Badge>;

    if (user.instructorRequest === "approved")
      return <Badge bg="success">Approved</Badge>;

    if (user.instructorRequest === "rejected")
      return <Badge bg="danger">Rejected</Badge>;

    return <Badge bg="secondary">None</Badge>;
  };

  // ================= LOADING =================
  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <div>
      <h4 className="mb-4">Manage Users</h4>

      <div className="d-none d-md-block">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Instructor Request</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>

                <td>{getRoleBadge(user.role)}</td>

                <td>
                  <Badge bg="secondary">{user.accountStatus}</Badge>
                </td>

                <td>{getInstructorStatus(user)}</td>

                <td>
                  <div className="d-flex gap-2">

                    {/* DELETE */}
                    {user.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    )}

                    {/* APPROVE / REJECT */}
                    {user.instructorRequest === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => approveInstructor(user._id)}
                        >
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => rejectInstructor(user._id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {user.instructorRequest === "approved" && (
                      // <Badge bg="success">Instructor</Badge>
                      <></>
                    )}

                    {user.instructorRequest === "rejected" && (
                      <></>
                    )}

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="d-md-none px-2">
        {users.map((user) => (
          <MobileCard
            key={user._id}
            title={user.username}
            fields={[
              { label: "Email", value: user.email },
              { label: "Role", value: getRoleBadge(user.role) },
              { label: "Status", value: user.accountStatus },
              { label: "Request", value: getInstructorStatus(user) },
            ]}
            actions={
              <>
                {/* DELETE */}
                {user.role !== "admin" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </Button>
                )}

                {/* APPROVE / REJECT */}
                {user.instructorRequest === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => approveInstructor(user._id)}
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => rejectInstructor(user._id)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </>
            }
          />
        ))}
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.username}?`}
      />
    </div>
  );
}