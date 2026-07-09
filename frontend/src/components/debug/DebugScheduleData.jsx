import { useCallback, useEffect, useState } from 'react';
import useMLScheduleStore from "../../stores/useMLScheduleStore";
import useScheduleStore from "../../stores/useScheduleStore";

/**
 * Debug component to test data fetching
 * Use this component to identify where the data fetching issue is occurring
 */
export default function DebugScheduleData() {
  const [debugInfo, setDebugInfo] = useState({});
  
  // ML Schedule Store (used by SchedulePage)
  const { 
    publicSchedule, 
    loading: mlLoading, 
    error: mlError, 
    fetchPublicSchedule 
  } = useMLScheduleStore();
  
  // Regular Schedule Store
  const { 
    schedules, 
    locations, 
    drivers, 
    loading: scheduleLoading, 
    error: scheduleError, 
    fetchAllData 
  } = useScheduleStore();

  const testBothStores = useCallback(async () => {
        setDebugInfo({ testing: 'Iniciando teste de agenda...' });
      
      try {
        // Test ML Schedule Store
        console.log('Testing ML Schedule Store...');
        await fetchPublicSchedule();
        
        // Test Regular Schedule Store
        console.log('Testing Regular Schedule Store...');
        await fetchAllData();

        const mlState = useMLScheduleStore.getState();
        const scheduleState = useScheduleStore.getState();
        
        setDebugInfo({
          testing: 'Concluído',
          mlSchedule: {
            data: mlState.publicSchedule,
            loading: mlState.loading,
            error: mlState.error
          },
          regularSchedule: {
            schedules: scheduleState.schedules,
            locations: scheduleState.locations,
            drivers: scheduleState.drivers,
            loading: scheduleState.loading,
            error: scheduleState.error
          }
        });
      } catch (error) {
        console.error('Debug test failed:', error);
        setDebugInfo({
          testing: 'Falhou',
          error: error.message
        });
      }
  }, [fetchAllData, fetchPublicSchedule]);

  useEffect(() => {
    const timer = setTimeout(testBothStores, 0);
    return () => clearTimeout(timer);
  }, [testBothStores]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Debug dos dados da agenda</h2>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Status do teste:</h3>
          <pre className="text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="p-3 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Store da agenda IA usada pela tela do cliente:</h3>
          <ul className="text-sm space-y-1">
            <li>Carregando: {mlLoading ? 'sim' : 'não'}</li>
            <li>Erro: {mlError || 'nenhum'}</li>
            <li>Agenda pública: {publicSchedule ? 'dados disponíveis' : 'sem dados'}</li>
            {publicSchedule && (
              <li>Areas: {publicSchedule.districts?.length || 0}</li>
            )}
          </ul>
        </div>
        
        <div className="p-3 bg-green-50 rounded">
          <h3 className="font-semibold mb-2">Store regular da agenda:</h3>
          <ul className="text-sm space-y-1">
            <li>Carregando: {scheduleLoading ? 'sim' : 'não'}</li>
            <li>Erro: {scheduleError || 'nenhum'}</li>
            <li>Agendas: {schedules?.length || 0}</li>
            <li>Locais: {locations?.length || 0}</li>
            <li>Coletores: {drivers?.length || 0}</li>
          </ul>
        </div>
        
        <div className="p-3 bg-yellow-50 rounded">
          <h3 className="font-semibold mb-2">Logs do console:</h3>
          <p className="text-sm text-gray-600">
            Verifique o console do navegador para detalhes das requisições e respostas da API.
          </p>
        </div>
      </div>
    </div>
  );
}
