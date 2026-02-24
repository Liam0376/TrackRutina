import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Droplets,
  Sun,
  Moon,
  Utensils,
  Dumbbell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  Bell,
  BellRing
} from 'lucide-react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';

// Configuración para Vercel
const firebaseConfig = {
  apiKey: 'AIzaSyBeME0xWDMqfN3BFXsRlWhqeFEwayoHErw',
  authDomain: 'trackrutina.firebaseapp.com',
  projectId: 'trackrutina',
  storageBucket: 'trackrutina.firebasestorage.app',
  messagingSenderId: '273876663923',
  appId: '1:273876663923:web:39191e8f8d5e3de760f406',
  measurementId: 'G-L3J4ZZWH37',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedItems, setCompletedItems] = useState<Record<string, string[]>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const dateKey = currentDate.toISOString().split('T')[0];
  const dayOfWeek = currentDate.getDay();

  // Autenticación limpia
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error: any) {
        console.error('Error al autenticar:', error);
        setUser({ uid: 'local-user', isLocal: true, errorCode: error.code || error.message });
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cargar datos
  useEffect(() => {
    if (!user || user.isLocal) return;

    const progressRef = collection(db, 'users', user.uid, 'progress');

    const unsubscribe = onSnapshot(
      progressRef,
      (snapshot) => {
        const serverData: Record<string, string[]> = {};
        snapshot.forEach((doc) => {
          serverData[doc.id] = doc.data().items || [];
        });
        setCompletedItems(serverData);
      },
      (error) => {
        console.error('Error cargando progreso:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const toggleItem = async (id: string) => {
    if (!user) return;

    const dayItems = completedItems[dateKey] || [];
    const newItems = dayItems.includes(id)
      ? dayItems.filter((i) => i !== id)
      : [...dayItems, id];

    setCompletedItems((prev) => ({ ...prev, [dateKey]: newItems }));

    if (user.isLocal) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'progress', dateKey);

      await setDoc(
        docRef,
        { items: newItems, lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error al guardar en la nube:', error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification('¡Notificaciones activadas!', {
        body: 'Te recordaré mantener el ritmo de tu rutina entre clases.',
      });
    } else {
      setNotificationsEnabled(false);
    }
  };

  const routine = useMemo(() => {
    const sections = [];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWednesday = dayOfWeek === 3;
    const isGymDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5;

    sections.push({
      title: 'Skincare AM & Arranque',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      items: [
        { id: 'sam1', text: 'Limpiador suave y secado' },
        { id: 'sam2', text: 'Ácido Salicílico (Esperar 15 min)' },
        { id: 'sam3', text: 'Protector Solar Matificante' },
        { id: 'vlatte', text: 'V Latte Kaffee c/ agua o leche (60 cal | Mezcla de Hongos Adaptógenos)' },
      ],
    });

    const foodItems = [];
    if (isWeekend) {
      foodItems.push({
        id: 'f_oats_we',
        text: 'Avena Económica Sin Polvo (527 cal | 17.7g P | 58.3g C | 19.8g G)',
      });
    } else {
      foodItems.push({
        id: 'f_oats_wd',
        text: 'Overnight Oats c/ Birdman y Creatina (Aprox: 696 cal | 39.7g P)',
      });
    }

    foodItems.push({
      id: 'f_lunch',
      text: "Comida: Pollo Pilgrim's + Pasta + Spray (430 cal | 36.5g P | 41.5g C | 11.9g G)",
    });
    foodItems.push({
      id: 'f_vital',
      text: 'Suplemento: 1 Cápsula V-italboost (con comida)',
    });
    foodItems.push({
      id: 'f_dinner',
      text: 'Cena: Sándwich 3 huevos + Espinacas (444 cal | 29.6g P | 34.6g C | 22.5g G)',
    });
    
    if (isGymDay) {
      foodItems.push({
        id: 'f_shake_gym',
        text: 'Batido Post-Entreno (357 cal | 30.7g P | 24.7g C | 17.7g G)',
      });
    } else {
      foodItems.push({
        id: 'f_shake_rest',
        text: 'Batido Ligero (169 cal | 23g P | 20g C | 2g G)',
      });
    }

    sections.push({
      title: 'Alimentación (Dieta Curada)',
      icon: <Utensils className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
      items: foodItems,
    });

    sections.push({
      title: 'Hidratación',
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      items: [
        { id: 'h1', text: '1L Mañana (Durante V Latte o Desayuno)' },
        { id: 'h2', text: '1L Mediodía (Entre clases de Diseño de Sistemas)' },
        { id: 'h3', text: '1L Tarde/Entrenamiento' },
        { id: 'h4', text: '1L Noche' },
      ],
    });

    const fitnessItems = [];
    if (isGymDay) {
      let splitText = '';
      if (dayOfWeek === 1) splitText = 'Upper A (Pecho y Espalda)';
      if (dayOfWeek === 2) splitText = 'Lower A (Cuádriceps)';
      if (dayOfWeek === 4) splitText = 'Upper B (Hombros y Amplitud)';
      if (dayOfWeek === 5) splitText = 'Lower B (Cadena Posterior)';

      fitnessItems.push({
        id: 'gym_train',
        text: `Entrenamiento: ${splitText} (Acoplar a horas libres de Tec de MTY)`,
      });
      fitnessItems.push({
        id: 'gym_shower',
        text: 'Higiene: Ducha inmediata (< 30 min)',
      });
    } else {
      fitnessItems.push({
        id: 'gym_rest',
        text: 'Día de Descanso (Miércoles o Fines de semana)',
      });
    }

    sections.push({
      title: 'Entrenamiento (Jeff Nippard U/L)',
      icon: <Dumbbell className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      items: fitnessItems,
    });

    const pmItems = [{ id: 'spm1', text: 'Limpiador suave y secar al 100%' }];

    if (isWednesday || dayOfWeek === 6) {
      pmItems.push({
        id: 'spm2_rest',
        text: 'Skin Cycling: Cero Adapaleno (Día de reparación)',
      });
    } else {
      pmItems.push({
        id: 'spm2_active',
        text: 'Tratamiento: Adapaleno 0.1% (Tamaño chícharo)',
      });
    }

    pmItems.push({ id: 'spm3', text: 'Hidratación: Crema Neutrogena Face Care' });
    pmItems.push({ id: 'f_prep', text: 'Organización: Dejar listos los Overnight Oats en refri' });

    sections.push({
      title: 'Skincare PM & Cierre',
      icon: <Moon className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
      items: pmItems,
    });

    return sections;
  }, [dayOfWeek]);

  const totalTasks = routine.reduce((acc, section) => acc + section.items.length, 0);
  const completedTasksCount = (completedItems[dateKey] || []).filter((id) => {
    return routine.some((section) => section.items.some((item) => item.id === id));
  }).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);

  const dateString = currentDate.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-lg font-medium text-gray-500">Conectando con tu nube privada...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans dark:bg-gray-950 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {user.isLocal && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-sm text-sm mb-4">
            <p className="font-bold text-base mb-1">Modo sin conexión activado</p>
            <p className="mb-2">Hubo un problema al conectar con tu base de datos. El error reportado es: <strong>{user.errorCode}</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Si dice <strong>auth/operation-not-allowed</strong>: Ve a Firebase &gt; Authentication &gt; Sign-in method y habilita el método "Anónimo".</li>
              <li>Si dice <strong>auth/unauthorized-domain</strong>: Ve a Firebase &gt; Authentication &gt; Settings &gt; Authorized domains y agrega tu dominio de Vercel.</li>
            </ul>
          </div>
        )}

        <header className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative">
          <button
            onClick={requestNotifications}
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
              notificationsEnabled ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {notificationsEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </button>

          <div className="flex items-center justify-between mb-6 mt-4 md:mt-0">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </button>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 font-medium text-lg text-center">
                <Calendar className="w-5 h-5 hidden md:block" />
                <span>{formattedDate}</span>
              </div>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ChevronRight className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progreso Diario
              </span>
              <span className="text-2xl font-bold flex items-center gap-1">
                {progressPercentage}%
                {progressPercentage === 100 && <Award className="w-6 h-6 text-yellow-500 ml-1" />}
              </span>
            </div>
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </header>

        <main className="space-y-4">
          {routine.map((section, sIdx) => (
            <div key={sIdx} className={`rounded-2xl border p-5 ${section.color}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/60 dark:bg-black/20 rounded-xl shadow-sm">
                  {section.icon}
                </div>
                <h2 className="font-bold text-lg">{section.title}</h2>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => {
                  const isCompleted = (completedItems[dateKey] || []).includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                        ${isCompleted ? 'bg-white/40 border-transparent opacity-60 dark:bg-black/20' : 'bg-white border-white/50 shadow-sm hover:shadow-md dark:bg-gray-900/50 dark:border-gray-800'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? <CheckCircle2 className="w-6 h-6 text-black dark:text-white" /> : <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />}
                      </div>
                      <span className={`text-base font-medium leading-tight ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}