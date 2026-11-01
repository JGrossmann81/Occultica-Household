import sys, struct, array, math
a=array.array('f');a.frombytes(open(sys.argv[1],'rb').read());b=array.array('f');b.frombytes(open(sys.argv[2],'rb').read())
n=min(len(a),len(b));ra=math.sqrt(sum(x*x for x in a[:n])/n);rb=math.sqrt(sum(x*x for x in b[:n])/n)
err=math.sqrt(sum((a[i]-b[i])**2 for i in range(n))/n);pk=max(abs(x) for x in a[:n])
print(f"len {len(a)}/{len(b)} rms cpp {ra:.5f} js {rb:.5f} err {err:.6f} rel {err/(rb+1e-12):.5f} peak {pk:.3f}")
