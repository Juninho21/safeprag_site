import React, { useState, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  registrationNumber: string;
  activeIngredient: string;
  chemicalGroup: string;
  registration: string;
  batch: string;
  expirationDate: string;
  unit: string;
  measure: string;
  diluent: string;
  concentration: string;
  applicationMethod: string;
}

const PRODUCTS_STORAGE_KEY = 'safeprag_products';

export const ProductForm: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return savedProducts ? JSON.parse(savedProducts) : [];
  });

  const [product, setProduct] = useState<Product>({
    id: '',
    name: '',
    description: '',
    manufacturer: '',
    registrationNumber: '',
    activeIngredient: '',
    chemicalGroup: '',
    registration: '',
    batch: '',
    expirationDate: '',
    unit: '',
    measure: 'ml',
    diluent: '',
    concentration: '',
    applicationMethod: ''
  });

  const [editMode, setEditMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode) {
      // Atualizar produto existente
      const updatedProducts = products.map(p => 
        p.id === product.id ? product : p
      );
      setProducts(updatedProducts);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
      toast.success('Produto atualizado com sucesso!');
    } else {
      // Adicionar novo produto
      const newProduct = {
        ...product,
        id: Date.now().toString() // Gerar ID único
      };
      const newProducts = [...products, newProduct];
      setProducts(newProducts);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
      toast.success('Produto cadastrado com sucesso!');
    }

    // Limpar o formulário
    setProduct({
      id: '',
      name: '',
      description: '',
      manufacturer: '',
      registrationNumber: '',
      activeIngredient: '',
      chemicalGroup: '',
      registration: '',
      batch: '',
      expirationDate: '',
      unit: '',
      measure: 'ml',
      diluent: '',
      concentration: '',
      applicationMethod: ''
    });
    setEditMode(false);
  };

  const handleEdit = (productToEdit: Product) => {
    setProduct(productToEdit);
    setEditMode(true);
  };

  const handleDelete = (productId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(updatedProducts));
      toast.success('Produto excluído com sucesso!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{editMode ? 'Editar Produto' : 'Cadastro de Produtos'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do produto/concentração
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="activeIngredient" className="block text-sm font-medium text-gray-700">
                Princípio ativo
              </label>
              <input
                type="text"
                id="activeIngredient"
                name="activeIngredient"
                value={product.activeIngredient}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="chemicalGroup" className="block text-sm font-medium text-gray-700">
                Grupo químico
              </label>
              <input
                type="text"
                id="chemicalGroup"
                name="chemicalGroup"
                value={product.chemicalGroup}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
                Registro
              </label>
              <input
                type="text"
                id="registration"
                name="registration"
                value={product.registration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="batch" className="block text-sm font-medium text-gray-700">
                Lote
              </label>
              <input
                type="text"
                id="batch"
                name="batch"
                value={product.batch}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                Validade
              </label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                value={product.expirationDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                Unidade
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={product.unit}
                  onChange={handleChange}
                  placeholder="Ex: 1L, 500ml, 250g"
                  className="flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <select
                  name="measure"
                  value={product.measure}
                  onChange={handleChange}
                  className="rounded-r-md border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="diluent" className="block text-sm font-medium text-gray-700">
                Diluente
              </label>
              <input
                type="text"
                id="diluent"
                name="diluent"
                value={product.diluent}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {editMode ? 'Atualizar Produto' : 'Cadastrar Produto'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Produtos */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Produtos Cadastrados</h2>
          <div className="space-y-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Princípio ativo:</span> {p.activeIngredient}</p>
                  <p><span className="font-medium">Grupo químico:</span> {p.chemicalGroup}</p>
                  <p><span className="font-medium">Registro:</span> {p.registration}</p>
                  <p><span className="font-medium">Lote:</span> {p.batch}</p>
                  <p><span className="font-medium">Validade:</span> {new Date(p.expirationDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Unidade:</span> {p.unit} {p.measure}</p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum produto cadastrado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
