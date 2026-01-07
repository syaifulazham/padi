import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.users.getAll();
      if (result.success) {
        setUsers(result.data);
      } else {
        message.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      status: user.status
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      const result = await window.electronAPI.users.delete(userId);
      if (result.success) {
        message.success('User deleted successfully');
        loadUsers();
      } else {
        message.error(result.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Error deleting user');
    }
  };

  const handleSubmit = async (values) => {
    try {
      let result;
      if (editingUser) {
        // Update existing user
        const updateData = {
          full_name: values.full_name,
          role: values.role,
          status: values.status
        };
        if (values.password) {
          updateData.password = values.password;
        }
        result = await window.electronAPI.users.update(editingUser.user_id, updateData);
      } else {
        // Create new user
        result = await window.electronAPI.users.create(values);
      }

      if (result.success) {
        message.success(editingUser ? 'User updated successfully' : 'User created successfully');
        setModalVisible(false);
        form.resetFields();
        loadUsers();
      } else {
        message.error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      message.error('Error saving user');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const colors = {
          admin: 'red',
          operator: 'blue',
          viewer: 'green'
        };
        return <Tag color={colors[role]}>{role.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          active: 'green',
          inactive: 'orange',
          suspended: 'red'
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.user_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="User Management"
      extra={
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleCreate}
        >
          Add User
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="user_id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Total ${total} users`
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: !editingUser, message: 'Please enter username' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input
              placeholder="Enter username"
              disabled={!!editingUser}
              autoComplete="off"
            />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
            rules={[
              { required: !editingUser, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              placeholder="Enter password"
              autoComplete="new-password"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="operator"
          >
            <Select>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="operator">Operator</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="suspended">Suspended</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
