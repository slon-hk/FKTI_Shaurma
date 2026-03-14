import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, ZoomControl } from '@pbe/react-yandex-maps';
import { X, MessageSquare, Hash, MapPin, Banknote, Ruler, Navigation } from 'lucide-react'; // Добавили Navigation
import { supabase } from './supabase';

function App() {
  const [points, setPoints] = useState([]); 
  const [modalMode, setModalMode] = useState(null); 
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', review: '', price: 'medium', size: 'medium' 
  });

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    const { data, error } = await supabase.from('shaurma_points').select('*');
    if (!error && data) setPoints(data);
  };

  const onMapClick = (e) => {
    const coords = e.get('coords');
    setSelectedPoint({ lat: coords[0], lng: coords[1] });
    setFormData({ name: '', review: '', price: 'medium', size: 'medium' });
    setModalMode('create');
  };

  const savePoint = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Введите название!");

    const newReview = formData.review 
      ? [{ text: formData.review, date: new Date().toLocaleDateString() }] 
      : [];

    const pointData = {
      lat: selectedPoint.lat,
      lng: selectedPoint.lng,
      name: formData.name,
      price: formData.price,
      size: formData.size,
      reviews: newReview
    };

    const { data, error } = await supabase
      .from('shaurma_points')
      .insert([pointData])
      .select();

    if (error) {
      console.error("Ошибка сохранения точки:", error);
      alert("Не удалось сохранить место");
    } else if (data) {
      setPoints([...points, data[0]]);
      setModalMode(null);
    }
  };

  const handleAddReview = async () => {
    const txt = prompt("Напиши свой отзыв:");
    if (!txt) return;

    const newReviews = [{ text: txt, date: new Date().toLocaleDateString() }, ...(selectedPoint.reviews || [])];

    const { error } = await supabase
      .from('shaurma_points')
      .update({ reviews: newReviews })
      .eq('id', selectedPoint.id);

    if (!error) {
      const updatedPoints = points.map(p => p.id === selectedPoint.id ? { ...p, reviews: newReviews } : p);
      setPoints(updatedPoints);
      setSelectedPoint({ ...selectedPoint, reviews: newReviews });
    }
  };

  const getPriceText = (price) => {
    if (price === 'cheap') return 'Бюджетно (₽)';
    if (price === 'medium') return 'Средне (₽₽)';
    return 'Дорого (₽₽₽)';
  };

  const getSizeText = (size) => {
    if (size === 'small') return 'S';
    if (size === 'medium') return 'M';
    return 'L/XL';
  };

  return (
    <div className="h-[100dvh] w-screen bg-slate-100 flex flex-col md:p-8 font-sans overflow-hidden relative">
      
      <header className="absolute top-4 left-4 right-4 md:static md:mb-4 flex justify-between items-center bg-white/90 backdrop-blur-md md:bg-white px-5 py-3 md:px-6 md:py-4 rounded-3xl md:rounded-[32px] shadow-lg md:shadow-sm z-[1000] border border-white/40 md:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-inner">
            <span className="text-lg md:text-xl leading-none block">🌯</span>
          </div>
          <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase leading-none tracking-tighter">
            FKTI<span className="text-amber-500">Shaurma</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-slate-500 bg-slate-100 md:bg-slate-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase border border-slate-200 md:border-slate-100">
          <MapPin size={12} className="text-amber-500" /> 
          <span>{points.length}</span>
        </div>
      </header>

      <div className="flex-1 rounded-none md:rounded-[40px] overflow-hidden shadow-none md:shadow-2xl border-none md:border-4 border-white relative bg-slate-200">
        <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_API_KEY, lang: 'ru_RU', load: 'package.full' }}>
          <Map 
            defaultState={{ center: [59.9386, 30.3141], zoom: 14 }} 
            width="100%" height="100%"
            onClick={onMapClick}
            options={{ suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }}
          >
            <ZoomControl options={{ position: { right: 10, bottom: 50 } }} className="hidden md:block" />
            
            {points.map(p => (
              <Placemark 
                key={p.id}
                geometry={[p.lat, p.lng]}
                options={{ preset: 'islands#yellowFoodIcon', iconColor: '#fbbf24' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(p);
                  setModalMode('view');
                }}
              />
            ))}
          </Map>
        </YMaps>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 md:bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setModalMode(null)} />
          
          <div className="bg-white w-full md:max-w-md max-h-[85dvh] md:max-h-[90vh] overflow-y-auto rounded-t-[32px] md:rounded-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl relative p-6 md:p-8 z-10 custom-scrollbar animate-in slide-in-from-bottom md:zoom-in-95 duration-300 flex flex-col">
            
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden flex-shrink-0"></div>

            <button onClick={() => setModalMode(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-slate-400 hover:text-slate-800 bg-slate-50 md:bg-slate-100 rounded-full z-20">
              <X size={20} />
            </button>

            {modalMode === 'create' ? (
              <form onSubmit={savePoint} className="space-y-5">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Новое место</h2>
                
                <div className="space-y-3">
                  <input 
                    autoFocus
                    className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 rounded-2xl md:rounded-[24px] focus:ring-2 ring-amber-400 outline-none font-bold text-sm md:text-base shadow-inner"
                    placeholder="Название шавермы"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />

                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 p-1 rounded-2xl md:rounded-[24px] shadow-inner flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase text-center mt-1"><Banknote size={10} className="inline mr-1 mb-0.5"/>Цена</span>
                       <div className="flex mt-1">
                        {['cheap', 'medium', 'expensive'].map(lvl => (
                          <button
                            key={lvl} type="button" onClick={() => setFormData({...formData, price: lvl})}
                            className={`flex-1 py-2 rounded-xl md:rounded-[20px] text-[10px] md:text-xs font-black transition-all ${
                              formData.price === lvl ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {lvl === 'cheap' ? '₽' : lvl === 'medium' ? '₽₽' : '₽₽₽'}
                          </button>
                        ))}
                       </div>
                    </div>

                    <div className="flex-1 bg-slate-50 p-1 rounded-2xl md:rounded-[24px] shadow-inner flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase text-center mt-1"><Ruler size={10} className="inline mr-1 mb-0.5"/>Размер</span>
                       <div className="flex mt-1">
                        {['small', 'medium', 'large'].map(lvl => (
                          <button
                            key={lvl} type="button" onClick={() => setFormData({...formData, size: lvl})}
                            className={`flex-1 py-2 rounded-xl md:rounded-[20px] text-[10px] md:text-xs font-black transition-all ${
                              formData.size === lvl ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {lvl === 'small' ? 'S' : lvl === 'medium' ? 'M' : 'L'}
                          </button>
                        ))}
                       </div>
                    </div>
                  </div>

                  <textarea 
                    className="w-full px-5 py-3 md:px-6 md:py-4 bg-slate-50 rounded-2xl md:rounded-[24px] focus:ring-2 ring-amber-400 outline-none h-24 md:h-28 resize-none font-medium text-xs md:text-sm shadow-inner"
                    placeholder="Хрустит ли лаваш? Достаточно ли соуса?..."
                    value={formData.review}
                    onChange={e => setFormData({...formData, review: e.target.value})}
                  />
                </div>

                <button className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl md:rounded-[24px] font-black text-sm uppercase tracking-[0.1em] active:scale-95 shadow-xl shadow-slate-200 mt-2 transition-transform">
                  Сохранить
                </button>
              </form>
            ) : (
              <div className="flex flex-col h-full mt-2">
                <div className="flex-shrink-0 space-y-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-[9px] uppercase bg-amber-50 inline-flex px-2 py-1 rounded-full mb-2">
                      <Hash size={10} /> Проверено
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase italic tracking-tighter leading-none break-words">{selectedPoint?.name}</h2>
                  </div>

                  <div className="flex gap-2">
                     <div className="flex-1 bg-slate-50 py-2 rounded-xl flex justify-center items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 border border-slate-100">
                        <Banknote size={12} className="text-amber-500"/> {getPriceText(selectedPoint?.price)}
                     </div>
                     <div className="flex-1 bg-slate-50 py-2 rounded-xl flex justify-center items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 border border-slate-100">
                        <Ruler size={12} className="text-amber-500"/> {getSizeText(selectedPoint?.size)}
                     </div>
                  </div>
                </div>

                {/* Блок с отзывами (скроллится) */}
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar my-5">
                   {selectedPoint?.reviews?.length > 0 ? (
                     selectedPoint.reviews.map((r, i) => (
                       <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-xs md:text-sm font-medium text-slate-700 leading-relaxed">«{r.text}»</p>
                          <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">{r.date}</p>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-6">
                        <MessageSquare className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-[10px] font-bold text-slate-300 uppercase">Пока без отзывов</p>
                     </div>
                   )}
                </div>

                {/* Кнопки в самом низу */}
                <div className="flex flex-col gap-2 mt-auto flex-shrink-0">
                  <a 
                    href={`https://yandex.ru/maps/?rtext=~${selectedPoint?.lat},${selectedPoint?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl md:rounded-[24px] font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-slate-200 active:scale-95 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Navigation size={18} /> Как добраться
                  </a>
                  
                  <button 
                    onClick={handleAddReview}
                    className="w-full bg-amber-400 text-white py-4 rounded-2xl md:rounded-[24px] font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-amber-200 active:scale-95 hover:bg-amber-500 transition-all"
                  >
                    Добавить отзыв
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;