import React, { useState, useEffect } from 'react';
import {
  Box,
  Select,
  Flex,
  Text,
  Tooltip,
  Spinner,
  Badge,
  useToast
} from '@chakra-ui/react';
import { fetchGroqModels } from '../services/groqService';

const ModelSelector = ({ selectedModel, onSelectModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const availableModels = await fetchGroqModels();
        setModels(availableModels);
        
        // Verify if the currently selected model is in the list
        const modelExists = availableModels.some(model => model.id === selectedModel);
        
        // If not, select the first model from the list
        if (!modelExists && availableModels.length > 0) {
          onSelectModel(availableModels[0].id);
        }
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load available models');
        toast({
          title: 'Error loading models',
          description: err.message || 'Failed to fetch available models',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [selectedModel, onSelectModel, toast]);

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    onSelectModel(newModel);
    
    // Show toast confirmation
    const modelName = models.find(model => model.id === newModel)?.name || newModel;
    toast({
      title: 'Model changed',
      description: `Now using ${modelName}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // If there's only the default model, don't show the selector
  if (!loading && models.length <= 1 && !error) {
    return null;
  }

  return (
    <Box>
      <Flex alignItems="center" mb={1}>
        <Text fontSize="sm" color="gray.400" fontWeight="medium" mr={2}>
          Model:
        </Text>
        
        {loading && <Spinner size="xs" mr={2} color="blue.400" />}
        
        {error && (
          <Tooltip label={error} placement="top">
            <Badge colorScheme="red" variant="subtle">Error</Badge>
          </Tooltip>
        )}
      </Flex>
      
      <Select
        value={selectedModel}
        onChange={handleModelChange}
        isDisabled={loading || error || models.length === 0}
        size="sm"
        bg="gray.800"
        borderColor="gray.700"
        color="gray.200"
        _hover={{
          borderColor: "gray.600"
        }}
        _focus={{
          borderColor: "blue.500",
          boxShadow: "0 0 0 1px #3182ce"
        }}
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default ModelSelector;