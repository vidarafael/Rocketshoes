import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const getAmountProduct: number = await api.get(`/stock/${productId}`)
            .then(response => response.data.amount)

      const findItem = cart.find(product => product.id === productId)
     
      if(findItem?.amount === getAmountProduct) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(findItem) {
        const incrementAmount = cart.map(product => {
          if(product.id === findItem.id) {
            product.amount += 1
          }
          return product
        })
        setCart([...incrementAmount])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(cart))
        
      } else {
          const getProduct: Product = await api.get(`/products/${productId}`)
            .then(response => response.data)

          setCart([...cart, {...getProduct, amount: 1}])
          localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cart, {...getProduct, amount: 1}]))
      }
    } catch {
        toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const verifyProductExist = cart.find(product => product.id === productId)
      if(!verifyProductExist) {
        toast.error('Erro na remoção do produto')
        return;
      }

      const removingTheProduct = cart.filter((product) => product.id !== productId)
      
      setCart(removingTheProduct)
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(removingTheProduct))
    } catch {
        toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const getAmountProduct: number = await api.get(`/stock/${productId}`)
        .then(response => response.data.amount)
      
      if(amount <= 0) {
        return 
      }
      const verify = cart.find((product) => product.amount > getAmountProduct)
      
      if(verify) {
        toast.error("Quantidade solicitada fora de estoque");
        return

      }else {
        const updateAmount = cart.map((product) => {
          if(product.id === productId) {
            product.amount = amount
          }
          return product
        })
  
        setCart([...updateAmount])
        localStorage.setItem('@RocketShoes:cart',JSON.stringify(updateAmount))
      }
    } catch {
        toast.error('Erro na alteração de quantidade do produto');
    } 
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
