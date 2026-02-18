import { useState, useCallback, useRef } from "react";

// Placeholder API methods - replace with actual API implementation
const api = {
  get: async (url, params) => {
    console.log('API GET:', url, params);
    return { data: null };
  },
  post: async (url, data) => {
    console.log('API POST:', url, data);
    return { data: null };
  },
  put: async (url, data) => {
    console.log('API PUT:', url, data);
    return { data: null };
  },
  delete: async (url) => {
    console.log('API DELETE:', url);
    return { data: null };
  },
};

export const useApi = (apiCall, options = {}) => {
  const [state, setState] = useState({
    data: null,
    loading: options.immediate !== false,
    error: null,
  });

  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await apiCall();

      if (
        response &&
        typeof response === "object" &&
        "status" in response &&
        response.status >= 400
      ) {
        const errorMsg = response.message || "An error occurred";
        setState({ data: null, loading: false, error: errorMsg });
        options.onError?.(errorMsg);
        return;
      }

      if (isMountedRef.current) {
        setState({ data: response, loading: false, error: null });
        options.onSuccess?.(response);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unexpected error";
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error: errorMsg });
        options.onError?.(errorMsg);
      }
    }
  }, [apiCall, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return { ...state, execute, reset, setData };
};

export const useFetch = (url, params) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const isMountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await api.get(url, params);

      if (
        response &&
        typeof response === "object" &&
        "status" in response &&
        response.status >= 400
      ) {
        setState({ data: null, loading: false, error: response.message });
        return;
      }

      if (isMountedRef.current) {
        setState({ data: response, loading: false, error: null });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred";
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error: errorMsg });
      }
    }
  }, [url, params]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, refetch, reset };
};

export const useMutation = (mutationFn, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await mutationFn(data);

        if (
          response &&
          typeof response === "object" &&
          "status" in response &&
          response.status >= 400
        ) {
          const errorMsg = response.message || "An error occurred";
          setError(errorMsg);
          options.onError?.(errorMsg);
          return null;
        }

        setSuccess(true);
        options.onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unexpected error";
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { execute, loading, error, success, reset };
};

export const useForm = ({ initialValues, onSubmit, validate }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      if (validate) setErrors(validate(values));
    },
    [values, validate]
  );

  const handleSubmit = useCallback(
    () => async (e) => {
      e.preventDefault();

      if (validate) {
        const newErrors = validate(values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldTouched = useCallback((field, value) => {
    setTouched((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    isSubmitting,
  };
};

export default {
  useApi,
  useFetch,
  useMutation,
  useForm,
};
