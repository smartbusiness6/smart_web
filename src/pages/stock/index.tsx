// src/pages/stock/StockScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchProducts } from '../../redux/slices/stockSlice';
import { selectAllProducts, selectStockLoading } from '../../redux/selectors/stock.selector';
import { useAuth } from '../../contexts/AuthContext';

// react-icons
import { FaBoxOpen, FaExclamationTriangle, FaSearch, FaTimes, FaSyncAlt, FaPlus, FaChevronRight, FaFilter } from 'react-icons/fa';

type FilterType = 'all' | 'low' | 'out';

const PRODUCTS_PER_PAGE = 15;

export default function StockScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const products = useAppSelector(selectAllProducts) || [];
  const loading = useAppSelector(selectStockLoading);

  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  useEffect(() => {
    if (token) {
      dispatch(fetchProducts(token));
    }
  }, [token, dispatch]);

  const handleRefresh = () => {
    if (token) {
      setVisibleCount(PRODUCTS_PER_PAGE);
      dispatch(fetchProducts(token));
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(products.map(p => p.type).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const stats = useMemo(() => {
    const low = products.filter(p => p.quantite > 0 && p.quantite < 10).length;
    const out = products.filter(p => p.quantite === 0).length;
    return { low, out, categories: categories.length };
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (activeFilter === 'low') list = list.filter(p => p.quantite > 0 && p.quantite < 10);
    if (activeFilter === 'out') list = list.filter(p => p.quantite === 0);

    if (activeCategory) list = list.filter(p => p.type === activeCategory);

    if (searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      list = list.filter(p => p.nom.toLowerCase().includes(term) || p.numero.toLowerCase().includes(term));
    }

    return list.slice(0, visibleCount);
  }, [products, activeFilter, activeCategory, searchValue, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
  };

  const hasMore = visibleCount < filteredProducts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#04957d]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestion de Stock</h1>
        <button
          onClick={handleRefresh}
          className="p-3 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          title="Rafraîchir"
        >
          <FaSyncAlt className="text-[#04957d] text-xl" />
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <FaBoxOpen className="text-[#04957d] text-4xl" />
          <div>
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-gray-600">Produits totaux</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <FaExclamationTriangle className="text-yellow-500 text-4xl" />
          <div>
            <p className="text-2xl font-bold">{stats.low}</p>
            <p className="text-gray-600">Stock bas</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <FaExclamationTriangle className="text-red-500 text-4xl" />
          <div>
            <p className="text-2xl font-bold">{stats.out}</p>
            <p className="text-gray-600">Ruptures</p>
          </div>
        </div>
      </div>

      {/* Filtres + Recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:border-[#04957d] focus:outline-none transition"
          />
          {searchValue && (
            <FaTimes
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
              onClick={() => setSearchValue('')}
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'all' ? 'bg-[#04957d] text-white' : 'bg-white border border-gray-300'}`}
            onClick={() => setActiveFilter('all')}
          >
            Tous
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'low' ? 'bg-[#04957d] text-white' : 'bg-white border border-gray-300'}`}
            onClick={() => setActiveFilter('low')}
          >
            Bas
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeFilter === 'out' ? 'bg-[#04957d] text-white' : 'bg-white border border-gray-300'}`}
            onClick={() => setActiveFilter('out')}
          >
            Rupture
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:border-[#04957d] transition"
          >
            <FaFilter className="text-[#04957d]" />
            {activeCategory || 'Catégories'}
          </button>
          {showCategoryMenu && (
            <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <button
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => {
                  setActiveCategory(null);
                  setShowCategoryMenu(false);
                }}
              >
                Toutes
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => {
                    setActiveCategory(cat);
                    setShowCategoryMenu(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Liste produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate(`/stock/${product.id}`)} // Assume detail route
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{product.nom}</h3>
                <p className="text-gray-600">N° {product.numero}</p>
              </div>
              <FaChevronRight className="text-gray-400" />
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500">Prix achat</p>
                <p className="font-medium">{product.prixAchat.toLocaleString()} Ar</p>
              </div>
              <div>
                <p className="text-gray-500">Prix vente</p>
                <p className="font-medium">{product.prixVente.toLocaleString()} Ar</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-500">Stock</p>
              <p className={`font-bold ${product.quantite < 10 ? 'text-red-500' : 'text-green-600'}`}>
                {product.quantite}
              </p>
            </div>
            <p className="text-gray-500 mt-2">Catégorie: {product.type}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          className="block mx-auto px-6 py-3 bg-[#04957d] text-white rounded-lg hover:bg-[#037665] transition"
        >
          Charger plus
        </button>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-16">
          <FaBoxOpen className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-600">Aucun produit trouvé</p>
        </div>
      )}

      {/* FAB Add */}
      <button
        onClick={() => navigate('/stock/add')}
        className="fixed bottom-8 right-8 bg-[#04957d] text-white p-4 rounded-full shadow-lg hover:bg-[#037665] transition"
      >
        <FaPlus className="text-2xl" />
      </button>
    </div>
  );
}