"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { PlusCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: { label: string; value: string }[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: FacetedFilterProps<TData, TValue>) {
  const selected = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selected.size > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selected.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  onSelect={() => {
                    selected.has(opt.value)
                      ? selected.delete(opt.value)
                      : selected.add(opt.value)
                    column?.setFilterValue(
                      selected.size ? Array.from(selected) : undefined
                    )
                  }}
                >
                  <Checkbox checked={selected.has(opt.value)} className="mr-2" />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandItem
                  onSelect={() => column?.setFilterValue(undefined)}
                  className="justify-center"
                >
                  Clear filters
                </CommandItem>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
