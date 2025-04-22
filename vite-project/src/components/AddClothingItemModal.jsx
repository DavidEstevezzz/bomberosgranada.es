import React, { useState } from 'react';
import { Modal, Button, Form, Input } from 'antd';
import { useDarkMode } from '../contexts/DarkModeContext';
import ClothingItemApiService from '../services/ClothingItemApiService';

const AddClothingItemModal = ({ isOpen, onClose, onAdd }) => {
  const [form] = Form.useForm();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const newItem = {
        name: values.name,
      };
      
      await ClothingItemApiService.createClothingItem(newItem);
      form.resetFields();
      await onAdd();
    } catch (error) {
      console.error('Error al crear ítem de vestuario:', error);
      if (error.response && error.response.data.errors) {
        // Mostrar errores de validación del backend
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          form.setFields([
            {
              name: field,
              errors: Array.isArray(messages) ? messages : [messages],
            },
          ]);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Añadir Ítem de Vestuario"
      open={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          className="bg-blue-600"
        >
          Crear
        </Button>,
      ]}
      className={darkMode ? 'dark-mode-modal' : ''}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="Nombre"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre del ítem' },
            { max: 255, message: 'El nombre no puede exceder los 255 caracteres' }
          ]}
        >
          <Input placeholder="Nombre del ítem de vestuario" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddClothingItemModal;