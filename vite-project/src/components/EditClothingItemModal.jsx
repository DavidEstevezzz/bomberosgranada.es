import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input } from 'antd';
import { useDarkMode } from '../contexts/DarkModeContext';

const EditClothingItemModal = ({ isOpen, onClose, clothingItem, onUpdate }) => {
  const [form] = Form.useForm();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clothingItem && isOpen) {
      form.setFieldsValue({
        name: clothingItem.name,
      });
    }
  }, [clothingItem, isOpen, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const updatedItem = {
        ...clothingItem,
        name: values.name,
      };
      
      await onUpdate(updatedItem);
      onClose();
    } catch (error) {
      console.error('Error al validar formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Editar Ítem de Vestuario"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          className="bg-blue-600"
        >
          Actualizar
        </Button>,
      ]}
      className={darkMode ? 'dark-mode-modal' : ''}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: clothingItem?.name || '',
        }}
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

export default EditClothingItemModal;