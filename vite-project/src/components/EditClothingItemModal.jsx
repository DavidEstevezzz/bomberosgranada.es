import React, { useState, useEffect } from 'react';
import { Form, Input } from 'antd';
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

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const updatedItem = {
        ...clothingItem,
        name: values.name,
      };

      await onUpdate(updatedItem);
      onClose();
    } catch (error) {
      console.error('Error al actualizar ítem:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const overlayClass =
    'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur overflow-y-auto';
  const modalClass = `relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  }`;
  const headerClass = `flex items-start justify-between gap-4 px-6 py-5 text-white ${
    darkMode
      ? 'bg-gradient-to-r from-primary-900/90 via-primary-700/90 to-primary-600/80'
      : 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700'
  }`;
  const labelClass = 'text-xs font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200';
  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    darkMode
      ? 'border-slate-800 bg-slate-900/70 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const helperClass = `text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const cancelButtonClass = `inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-primary-500 focus:ring-offset-slate-900'
      : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 focus:ring-primary-500 focus:ring-offset-white'
  }`;
  const submitButtonClass = `inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    darkMode
      ? 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-slate-900'
      : 'bg-primary-600 hover:bg-primary-500 focus:ring-primary-400 focus:ring-offset-white'
  }`;

  return (
    <div className={overlayClass} onMouseDown={() => !loading && onClose()}>
      <div
        className={modalClass}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={headerClass}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Vestuario</p>
            <h2 className="mt-2 text-2xl font-semibold">Editar ítem de vestuario</h2>
            <p className="mt-3 text-sm text-white/90">
              Actualiza el nombre del elemento para mantener organizado el inventario del parque.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label="Cerrar"
            disabled={loading}
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: clothingItem?.name || '',
          }}
          className="space-y-6 px-6 py-6 sm:px-8"
          onFinish={handleSubmit}
        >
          <div className="space-y-2">
            <span className={labelClass}>Nombre del ítem</span>
            <Form.Item
              name="name"
              rules={[
                { required: true, message: 'Por favor ingrese el nombre del ítem' },
                { max: 255, message: 'El nombre no puede exceder los 255 caracteres' },
              ]}
              className="mb-0"
            >
              <Input
                placeholder="Ej. Chaquetón ignífugo"
                className={inputClass}
                disabled={loading}
              />
            </Form.Item>
            <p className={helperClass}>Utiliza un nombre claro y descriptivo.</p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={cancelButtonClass}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={submitButtonClass}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Actualizar ítem'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EditClothingItemModal;
